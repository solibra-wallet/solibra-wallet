import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import {
  decryptData,
  deserializeEncryptedData,
  encryptData,
  serielizeEncryptedData,
} from "./encryptionUtils";

export async function generateNewKeyRecord(
  password: string
): Promise<KeyRecord> {
  const keypair = Keypair.generate();
  const privateKey = bs58.encode(keypair.secretKey);

  return {
    name: keypair.publicKey.toString().slice(0, 5),
    publicKey: keypair.publicKey.toString(),
    privateKeyBox: serielizeEncryptedData(
      await encryptData(privateKey, password)
    ),
  };
}

export async function restorePrivateKey(
  keyRecord: KeyRecord,
  password: string
): Promise<string> {
  const encryptedDataType = deserializeEncryptedData(keyRecord.privateKeyBox);
  const decryptedKey = await decryptData(encryptedDataType, password);

  const privateKey = Uint8Array.from(bs58.decode(decryptedKey).slice(0, 32));

  const wallet = Keypair.fromSeed(privateKey);

  return wallet.publicKey.toString();
}

export type KeyRecord = {
  name: string;
  publicKey: string;
  privateKeyBox: string;
};
