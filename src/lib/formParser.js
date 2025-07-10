import formidable from "formidable";
import { Readable } from "stream";
import fs from "fs";
import path from "path";

/** ensure /public/uploads exists */
const uploadDir = path.join(process.cwd(), "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

export async function parseForm(request) {
  /* ---------- create a formidable instance ---------- */
  const form = formidable({
    uploadDir,
    multiples: true,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50 MB
    filename: (name, ext, part) =>
      Date.now() + "-" + part.originalFilename.replace(/\s+/g, "_"),
  });

  /* ---------- wrap Web Request body in Node stream ---------- */
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Readable body expected");

  const nodeStream = new Readable({
    async read() {
      const { done, value } = await reader.read();
      if (done) this.push(null);
      else this.push(Buffer.from(value));
    },
  });

  // formidable needs headers on the stream
  nodeStream.headers = Object.fromEntries(request.headers);

  /* ---------- parse ---------- */
  return new Promise((resolve, reject) => {
    form.parse(nodeStream, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

