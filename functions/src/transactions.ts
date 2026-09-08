import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { generateUaIban } from './utils/iban.utils';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

interface CreateAccountData {
  name: string;
  type: string;
  currency: string;
  balance: number;
  availableBalance: number;
  status: string;
}

interface TopUpData {
  accountId: string;
  amount: number;
}

interface LookupData {
  iban: string;
}

interface TransferData {
  fromAccountId: string;
  toIban: string;
  amount: number;
}

const normalizeIban = (iban: string) => iban.replace(/\s/g, '').toUpperCase();

const maskName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts.map((p, i) => (i === 0 ? p : `${p[0]}.`)).join(' ');
};

const MAX_IBAN_RETRIES = 3;

export const createAccount = onCall<CreateAccountData>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }

  const { name, type, currency, balance, availableBalance, status } =
    request.data ?? ({} as CreateAccountData);
  if (
    !name ||
    !type ||
    !currency ||
    typeof balance !== 'number' ||
    typeof availableBalance !== 'number' ||
    !status
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Name, type, currency, balance, availableBalance, and status are required.',
    );
  }

  // Check if user already has an account with this currency
  const existingAccountSnap = await db
    .collection('accounts')
    .where('userId', '==', uid)
    .where('currency', '==', currency)
    .where('status', '!=', 'closed')
    .limit(1)
    .get();

  if (!existingAccountSnap.empty) {
    throw new HttpsError('already-exists', `Account in ${currency} already exists`);
  }

  // Generate unique IBAN and create account in a transaction
  const result = await db.runTransaction(async (tx) => {
    let iban: string = '';
    let attempts = 0;

    while (attempts <= MAX_IBAN_RETRIES) {
      const seed = `${uid}-${name}-${Date.now()}-${attempts}-${Math.random()}`;
      iban = generateUaIban(seed);

      // Check if IBAN already exists
      const ibanSnap = await tx.get(db.collection('accounts').where('iban', '==', iban).limit(1));

      if (ibanSnap.empty) {
        // IBAN is unique, create the account
        const accountRef = db.collection('accounts').doc();
        const now = FieldValue.serverTimestamp();

        tx.set(accountRef, {
          userId: uid,
          name,
          type,
          currency,
          balance,
          availableBalance,
          status,
          iban,
          createdAt: now,
          updatedAt: now,
        });

        return { accountId: accountRef.id, iban };
      }

      attempts++;
    }

    throw new HttpsError('internal', 'Could not allocate unique IBAN');
  });

  return { success: true, accountId: result.accountId, iban: result.iban };
});

export const topUpAccount = onCall<TopUpData>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }

  const { accountId, amount } = request.data ?? ({} as TopUpData);
  if (!accountId || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new HttpsError('invalid-argument', 'A positive amount is required.');
  }
  if (amount > 1_000_000) {
    throw new HttpsError('invalid-argument', 'Amount exceeds the maximum limit.');
  }

  const accountRef = db.collection('accounts').doc(accountId);
  const txRef = db.collection('transactions').doc();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(accountRef);
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Account not found.');
    }
    const account = snap.data() as {
      userId?: string;
      currency?: string;
      status?: string;
    };
    if (account.userId !== uid) {
      throw new HttpsError('permission-denied', 'You do not own this account.');
    }
    if (account.status !== 'active') {
      throw new HttpsError('failed-precondition', 'Account is not active.');
    }

    tx.update(accountRef, {
      balance: FieldValue.increment(amount),
      availableBalance: FieldValue.increment(amount),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.set(txRef, {
      userId: uid,
      accountId,
      type: 'credit',
      status: 'completed',
      amount,
      currency: account.currency ?? 'UAH',
      description: 'Account top-up',
      createdAt: FieldValue.serverTimestamp(),
      processedAt: FieldValue.serverTimestamp(),
    });
  });

  return { success: true };
});

export const lookupAccountByIban = onCall<LookupData>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }

  const iban = normalizeIban(request.data?.iban ?? '');
  if (!iban) {
    throw new HttpsError('invalid-argument', 'IBAN is required.');
  }

  const snap = await db.collection('accounts').where('iban', '==', iban).limit(1).get();

  if (snap.empty) {
    throw new HttpsError('not-found', 'No account found with this IBAN.');
  }

  const account = snap.docs[0].data() as {
    name?: string;
    type?: string;
    currency?: string;
    status?: string;
    userId?: string;
  };

  let ownerName = 'Unknown';
  if (account.userId) {
    const userSnap = await db.collection('users').doc(account.userId).get();
    const userData = userSnap.data() as
      { displayName?: string; firstName?: string; lastName?: string } | undefined;
    if (userData) {
      const full = [userData.firstName, userData.lastName].filter(Boolean).join(' ');
      ownerName = full || userData.displayName || 'Unknown';
    }
  }

  return {
    name: account.name ?? '',
    type: account.type ?? '',
    currency: account.currency ?? '',
    status: account.status ?? '',
    isOwn: account.userId === uid,
    ownerName: maskName(ownerName),
    iban: iban,
  };
});

export const transferFunds = onCall<TransferData>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }

  const { fromAccountId, toIban, amount } = request.data ?? ({} as TransferData);
  if (
    !fromAccountId ||
    !toIban ||
    typeof amount !== 'number' ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Source account, IBAN and a positive amount are required.',
    );
  }

  const destIban = normalizeIban(toIban);
  const sourceRef = db.collection('accounts').doc(fromAccountId);
  const destSnap = await db.collection('accounts').where('iban', '==', destIban).limit(1).get();

  if (destSnap.empty) {
    throw new HttpsError('not-found', 'No account found with this IBAN.');
  }

  const destRef = destSnap.docs[0].ref;
  const destAccountId = destSnap.docs[0].id;

  const outTxRef = db.collection('transactions').doc();
  const inTxRef = db.collection('transactions').doc();
  const transferRef = outTxRef.id; // shared reference to link the pair
  const now = FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    const [sourceSnap, dest] = await Promise.all([tx.get(sourceRef), tx.get(destRef)]);

    if (!sourceSnap.exists) {
      throw new HttpsError('not-found', 'Source account not found.');
    }
    if (!dest.exists) {
      throw new HttpsError('not-found', 'Destination account not found.');
    }

    const source = sourceSnap.data() as {
      userId?: string;
      balance?: number;
      currency?: string;
      status?: string;
      name?: string;
      iban?: string;
    };
    const destination = dest.data() as {
      userId?: string;
      currency?: string;
      status?: string;
      name?: string;
      iban?: string;
    };

    if (source.userId !== uid) {
      throw new HttpsError('permission-denied', 'You do not own the source account.');
    }
    if (destIban === source.iban) {
      throw new HttpsError('invalid-argument', 'Cannot transfer to the same account.');
    }
    if (source.status !== 'active' || destination.status !== 'active') {
      throw new HttpsError('failed-precondition', 'Both accounts must be active.');
    }
    if (source.currency !== destination.currency) {
      throw new HttpsError('failed-precondition', 'Currency mismatch between accounts.');
    }
    if ((source.balance ?? 0) < amount) {
      throw new HttpsError('failed-precondition', 'Insufficient funds.');
    }

    const currency = source.currency ?? 'UAH';

    // Balances
    tx.update(sourceRef, {
      balance: FieldValue.increment(-amount),
      availableBalance: FieldValue.increment(-amount),
      updatedAt: now,
    });
    tx.update(destRef, {
      balance: FieldValue.increment(amount),
      availableBalance: FieldValue.increment(amount),
      updatedAt: now,
    });

    // 1) Outgoing — visible on source account
    tx.set(outTxRef, {
      userId: uid,
      accountId: fromAccountId,
      type: 'debit',
      status: 'completed',
      amount,
      currency,
      description: `Transfer to ${destination.name ?? destIban}`,
      counterpartyName: destination.name ?? '',
      counterpartyIban: destIban,
      reference: transferRef,
      createdAt: now,
      processedAt: now,
    });

    // 2) Incoming — visible on destination account
    tx.set(inTxRef, {
      userId: destination.userId ?? '',
      accountId: destAccountId,
      type: 'credit',
      status: 'completed',
      amount,
      currency,
      description: `Transfer from ${source.name ?? source.iban ?? 'account'}`,
      counterpartyName: source.name ?? '',
      counterpartyIban: source.iban ?? '',
      reference: transferRef,
      createdAt: now,
      processedAt: now,
    });
  });

  return {
    success: true,
    outTransactionId: outTxRef.id,
    inTransactionId: inTxRef.id,
  };
});
