import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const algorithm = "aes-256-gcm";

function getKey() {
  const material = process.env.OPERATION_SECRET_KEY || "operation-in-ai-local-development-key";
  return createHash("sha256").update(material).digest();
}

export function encryptSecret(value = "") {
  const text = String(value || "");
  if (!text || text === "******") return text;
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(value = "") {
  const text = String(value || "");
  if (!text.startsWith("enc:v1:")) return text;
  const [, , ivText, tagText, encryptedText] = text.split(":");
  try {
    const decipher = createDecipheriv(algorithm, getKey(), Buffer.from(ivText, "base64"));
    decipher.setAuthTag(Buffer.from(tagText, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedText, "base64")),
      decipher.final()
    ]).toString("utf8");
  } catch {
    return "";
  }
}

export function maskSecret(value = "") {
  const text = String(value || "");
  if (!text) return "";
  if (text.length <= 8) return "已配置";
  return `${text.slice(0, 4)}****${text.slice(-4)}`;
}
