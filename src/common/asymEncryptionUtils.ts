import {
  base64DecodeToUint8Array,
  base64EncodeFromUint8Array,
} from "./encodeDecodeUtils";

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
  //message: string
  message: Uint8Array
): Promise<string> {
  const encoder = new TextEncoder();
  // const data = encoder.encode(message);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    message
  );
  return base64EncodeFromUint8Array(new Uint8Array(encrypted));
}

export async function decryptMessage(
  privateKey: CryptoKey,
  encryptedMessage: string
): Promise<Uint8Array> {
  const decryptedContent = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    base64DecodeToUint8Array(encryptedMessage).buffer
  );
  // return new TextDecoder().decode(decryptedContent);
  return new Uint8Array(decryptedContent);
}

export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  return base64EncodeFromUint8Array(
    new Uint8Array(await window.crypto.subtle.exportKey("spki", publicKey))
  );
}

export async function importPublicKey(
  exportedPublicKey: string
): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    "spki",
    base64DecodeToUint8Array(exportedPublicKey),
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}
