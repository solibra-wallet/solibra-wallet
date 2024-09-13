import { bytesToHex, hexToBytes } from "./encodingUtils";

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  return keyPair;
}

export async function encryptMessage(
  publicKey: CryptoKey,
  message: Uint8Array
): Promise<string> {
  try {
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      message
    );
    return bytesToHex(new Uint8Array(encrypted));
  } catch (e) {
    console.error("error encrypting message", e);
    throw e;
  }
}

export async function decryptMessage(
  privateKey: CryptoKey,
  encryptedMessage: string
): Promise<Uint8Array> {
  const decryptedContent = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    hexToBytes(encryptedMessage).buffer
  );
  // return new TextDecoder().decode(decryptedContent);
  return new Uint8Array(decryptedContent);
}

export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  return bytesToHex(
    new Uint8Array(await window.crypto.subtle.exportKey("spki", publicKey))
  );
}

export async function importPublicKey(
  exportedPublicKey: string
): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    "spki",
    hexToBytes(exportedPublicKey),
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}
