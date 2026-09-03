import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {logger} from "firebase-functions";
import * as admin from "firebase-admin";
import PDFDocument from "pdfkit";
import {Writable} from "stream";

if (!admin.apps.length) {
  admin.initializeApp();
}

const isEmulator =
  process.env.FUNCTIONS_EMULATOR === "true" ||
  process.env.FIREBASE_STORAGE_EMULATOR_HOST != null;

const buildPdfBuffer = (title: string, lines: string[]): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({margin: 50});
    const chunks: Buffer[] = [];
    const stream = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(Buffer.from(chunk));
        cb();
      },
    });
    stream.on("finish", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    doc.pipe(stream);
    doc.fontSize(18).text(title, {underline: true});
    doc.moveDown();
    doc.fontSize(11);
    for (const line of lines) doc.text(line);
    doc.end();
  });
};

const document = "reports/{reportId}";

export const onReportCreated = onDocumentCreated(document, async (event) => {
  const snap = event.data;
  if (!snap) return;

  const reportId = event.params.reportId;
  const data = snap.data();
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  try {
    const userId = data.userId as string;
    const title = (data.title as string) || "Report";
    const type = data.type as string;

    const txSnap = await db
      .collection("transactions")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const lines = [
      `Type: ${type}`,
      `Generated: ${new Date().toISOString()}`,
      "",
      "Recent transactions:",
      ...txSnap.docs.map((d) => {
        const {description, type, amount, currency} = d.data();
        return `- ${description ?? ""} | ${type} | ${amount} ${currency}`;
      }),
    ];

    const pdf = await buildPdfBuffer(title, lines);
    const path = `reports/${userId}/${reportId}.pdf`;
    const file = bucket.file(path);

    await file.save(pdf, {
      contentType: "application/pdf",
      metadata: {metadata: {userId, reportId}},
    });

    let downloadUrl: string;

    if (isEmulator) {
      const host =
        process.env.FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1:5001";
      const bucketName = bucket.name;
      const encodedPath = encodeURIComponent(path);
      downloadUrl =
        `http://${host}/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
    } else {
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      downloadUrl = url;
    }

    await snap.ref.update({
      status: "ready",
      downloadUrl,
      storagePath: path,
    });

    logger.info(`Report ${reportId} ready`);
  } catch (err) {
    logger.error(err);
    await snap.ref.update({status: "failed"});
  }
});
