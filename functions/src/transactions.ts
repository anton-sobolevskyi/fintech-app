import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

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

const normalizeIban = (iban: string) => iban.replace(/\s/g, "").toUpperCase();

const maskName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts.map((p, i) => (i === 0 ? p : `${p[0]}.`)).join(" ");
};

export const topUpAccount = onCall<TopUpData>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const {accountId, amount} = request.data ?? ({} as TopUpData);
  if (!accountId || typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new HttpsError("invalid-argument", "A positive amount is required.");
  }
  if (amount > 1_000_000) {
    throw new HttpsError("invalid-argument", "Amount exceeds the maximum limit.");
  }

  const accountRef = db.collection("accounts").doc(accountId);
  const txRef = db.collection("transactions").doc();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(accountRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Account not found.");
    }
    const account = snap.data() as {
      userId?: string;
      currency?: string;
      status?: string;
    };
    if (account.userId !== uid) {
      throw new HttpsError("permission-denied", "You do not own this account.");
    }
    if (account.status !== "active") {
      throw new HttpsError("failed-precondition", "Account is not active.");
    }

    tx.update(accountRef, {
      balance: admin.firestore.FieldValue.increment(amount),
      availableBalance: admin.firestore.FieldValue.increment(amount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    tx.set(txRef, {
      userId: uid,
      accountId,
      type: "credit",
      status: "completed",
      amount,
      currency: account.currency ?? "UAH",
      description: "Account top-up",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return {success: true};
});

export const lookupAccountByIban = onCall<LookupData>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const iban = normalizeIban(request.data?.iban ?? "");
  if (!iban) {
    throw new HttpsError("invalid-argument", "IBAN is required.");
  }

  const snap = await db.collection("accounts").where("iban", "==", iban).limit(1).get();

  if (snap.empty) {
    throw new HttpsError("not-found", "No account found with this IBAN.");
  }

  const account = snap.docs[0].data() as {
    name?: string;
    type?: string;
    currency?: string;
    status?: string;
    userId?: string;
  };

  let ownerName = "Unknown";
  if (account.userId) {
    const userSnap = await db.collection("users").doc(account.userId).get();
    const userData = userSnap.data() as
      | {displayName?: string; firstName?: string; lastName?: string}
      | undefined;
    if (userData) {
      const full = [userData.firstName, userData.lastName].filter(Boolean).join(" ");
      ownerName = full || userData.displayName || "Unknown";
    }
  }

  return {
    name: account.name ?? "",
    type: account.type ?? "",
    currency: account.currency ?? "",
    status: account.status ?? "",
    isOwn: account.userId === uid,
    ownerName: maskName(ownerName),
  };
});

export const transferFunds = onCall<TransferData>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const {fromAccountId, toIban, amount} = request.data ?? ({} as TransferData);
  if (
    !fromAccountId ||
    !toIban ||
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Source account, IBAN and a positive amount are required."
    );
  }

  const destIban = normalizeIban(toIban);

  const sourceRef = db.collection("accounts").doc(fromAccountId);
  const destSnap = await db
    .collection("accounts")
    .where("iban", "==", destIban)
    .limit(1)
    .get();

  if (destSnap.empty) {
    throw new HttpsError("not-found", "No account found with this IBAN.");
  }
  const destRef = destSnap.docs[0].ref;

  const txRef = db.collection("transactions").doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    const [sourceSnap, dest] = await Promise.all([tx.get(sourceRef), tx.get(destRef)]);

    if (!sourceSnap.exists) {
      throw new HttpsError("not-found", "Source account not found.");
    }
    if (!dest.exists) {
      throw new HttpsError("not-found", "Destination account not found.");
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
      currency?: string;
      status?: string;
      name?: string;
      iban?: string;
    };

    if (source.userId !== uid) {
      throw new HttpsError("permission-denied", "You do not own the source account.");
    }
    if (destIban === source.iban) {
      throw new HttpsError("invalid-argument", "Cannot transfer to the same account.");
    }
    if (source.status !== "active" || destination.status !== "active") {
      throw new HttpsError("failed-precondition", "Both accounts must be active.");
    }
    if (source.currency !== destination.currency) {
      throw new HttpsError("failed-precondition", "Currency mismatch between accounts.");
    }
    const balance = source.balance ?? 0;
    if (balance < amount) {
      throw new HttpsError("failed-precondition", "Insufficient funds.");
    }

    tx.update(sourceRef, {
      balance: admin.firestore.FieldValue.increment(-amount),
      availableBalance: admin.firestore.FieldValue.increment(-amount),
      updatedAt: now,
    });
    tx.update(destRef, {
      balance: admin.firestore.FieldValue.increment(amount),
      availableBalance: admin.firestore.FieldValue.increment(amount),
      updatedAt: now,
    });

    tx.set(txRef, {
      userId: uid,
      accountId: fromAccountId,
      type: "transfer",
      status: "completed",
      amount,
      currency: source.currency ?? "UAH",
      description: `Transfer to ${destination.name ?? destIban}`,
      counterpartyName: destination.name ?? "",
      counterpartyIban: destIban,
      createdAt: now,
      processedAt: now,
    });
  });

  return {success: true};
});
