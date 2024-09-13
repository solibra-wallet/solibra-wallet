import { base64Decode, base64Encode } from "./encodingUtils";

async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encodedPassword = new TextEncoder().encode(password);
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encodedPassword,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 600000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  return derivedKey;
}

type EncryptedDataType = {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  authTag: Uint8Array;
  salt: Uint8Array;
};

async function encryptData(data: string, password: string): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16)); // 128-bit salt
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for AES-GCM
  const key = await deriveKey(password, salt);
  const encodedData = new TextEncoder().encode(data);

  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128, // 128-bit tag length
    },
    key,
    encodedData
  );

  // extract the ciphertext and authentication tag
  const ciphertext = encryptedContent.slice(
    0,
    encryptedContent.byteLength - 16
  );
  const authTag = encryptedContent.slice(encryptedContent.byteLength - 16);

  return serielizeEncryptedData({
    ciphertext: new Uint8Array(ciphertext),
    iv: iv,
    authTag: new Uint8Array(authTag),
    salt: salt,
  });
}

async function decryptData(
  encryptedData: string,
  password: string
): Promise<string> {
  const { ciphertext, iv, authTag, salt } =
    deserializeEncryptedData(encryptedData);
  const key = await deriveKey(password, salt);

  // re-combine the ciphertext and the authentication tag
  const dataWithAuthTag = new Uint8Array(ciphertext.length + authTag.length);
  dataWithAuthTag.set(ciphertext, 0);
  dataWithAuthTag.set(authTag, ciphertext.length);

  const decryptedContent = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv, tagLength: 128 },
    key,
    dataWithAuthTag
  );

  return new TextDecoder().decode(decryptedContent);
}

function serielizeEncryptedData(encryptedData: EncryptedDataType) {
  return base64Encode(
    JSON.stringify({
      ciphertext: Array.from(encryptedData.ciphertext),
      iv: Array.from(encryptedData.iv),
      authTag: Array.from(encryptedData.authTag),
      salt: Array.from(encryptedData.salt),
    })
  );
}

function deserializeEncryptedData(data: string): EncryptedDataType {
  const parsedData = JSON.parse(base64Decode(data));
  return {
    ciphertext: new Uint8Array(parsedData.ciphertext),
    iv: new Uint8Array(parsedData.iv),
    authTag: new Uint8Array(parsedData.authTag),
    salt: new Uint8Array(parsedData.salt),
  };
}

export { encryptData, decryptData };
