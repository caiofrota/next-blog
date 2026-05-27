import crypto from "node:crypto";

const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

function scryptAsync(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

export async function verifyPassword(passwordHash: string, password: string) {
  const [prefix, salt, hash] = passwordHash.split("$");
  if (prefix !== HASH_PREFIX || !salt || !hash) {
    return false;
  }

  const derivedKey = await scryptAsync(password, salt);
  const storedHash = Buffer.from(hash, "base64url");

  return storedHash.length === derivedKey.length && crypto.timingSafeEqual(storedHash, derivedKey);
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const derivedKey = await scryptAsync(password, salt);
  return `${HASH_PREFIX}$${salt}$${derivedKey.toString("base64url")}`;
}
