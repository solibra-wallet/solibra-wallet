import { bytesToHex, concatUint8Arrays, hexToBytes } from "./encodingUtils";

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-512",
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
  const inputChunks = [];
  const CHUNK_SIZE = 350;
  const numChunks =
    (message.length - (message.length % CHUNK_SIZE)) / CHUNK_SIZE +
    (message.length % CHUNK_SIZE > 0 ? 1 : 0);
  for (let i = 0; i < numChunks; i++) {
    inputChunks.push(message.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
  }

  try {
    const outputs: string[] = [];
    for (let i = 0; i < inputChunks.length; i++) {
      const encrypted = await crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        publicKey,
        inputChunks[i]
      );
      outputs.push(bytesToHex(new Uint8Array(encrypted)));
    }
    return outputs.join(";");
  } catch (e) {
    console.error("error encrypting message", e);
    throw e;
  }
}

export async function decryptMessage(
  privateKey: CryptoKey,
  encryptedMessage: string
): Promise<Uint8Array> {
  const inputChunks: Uint8Array[] = encryptedMessage.split(";").map(hexToBytes);

  try {
    const outputs: Uint8Array[] = [];
    for (let i = 0; i < inputChunks.length; i++) {
      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        inputChunks[i].buffer
      );
      outputs.push(new Uint8Array(decryptedContent));
    }
    return concatUint8Arrays(outputs);
  } catch (e) {
    console.error("error decrypting message", e);
    throw e;
  }
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
      hash: "SHA-512",
    },
    true,
    ["encrypt"]
  );
}
