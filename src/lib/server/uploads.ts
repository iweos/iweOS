import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const UPLOAD_ROOT = path.join(PUBLIC_ROOT, "uploads");

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}

function extensionFromFile(file: File) {
  const fromName = path.extname(file.name || "").toLowerCase();
  if (fromName) {
    return fromName;
  }

  const mimeMap: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
  };

  return mimeMap[file.type] ?? ".bin";
}

export async function storeUploadedImage(params: {
  file: File;
  folder: string[];
  fileStem: string;
}) {
  const { file, folder, fileStem } = params;

  if (!file.type.startsWith("image/")) {
    throw new Error("Upload a valid image file.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image upload must be 5MB or smaller.");
  }

  const safeFolder = folder.map(sanitizeSegment);
  const safeStem = sanitizeSegment(fileStem);
  const extension = extensionFromFile(file);
  const fileName = `${safeStem}-${crypto.randomUUID().slice(0, 8)}${extension}`;
  const absoluteDir = path.join(UPLOAD_ROOT, ...safeFolder);
  const absolutePath = path.join(absoluteDir, fileName);

  await mkdir(absoluteDir, { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  return `/uploads/${safeFolder.join("/")}/${fileName}`;
}

