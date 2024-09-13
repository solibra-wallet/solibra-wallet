import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { decryptData, encryptData } from "../common/passwordEncryptionUtils";

export async function generateNewKeypair(): Promise<Keypair> {
  return Keypair.generate();
}

export async function generateNewKeyRecord(
  keypair: Keypair,
  password: string
): Promise<KeyRecord> {
  const privateKey = bs58.encode(keypair.secretKey);
  return {
    name: keypair.publicKey.toString().slice(0, 5),
    publicKey: keypair.publicKey.toString(),
    viewOnly: false,
    privateKeyBox: await encryptData(privateKey, password),
  };
}

export async function generateNewViewOnlyKeyRecord(
  publicKey: string
): Promise<KeyRecord> {
  return {
    name: publicKey.toString().slice(0, 5),
    publicKey: publicKey.toString(),
    viewOnly: true,
    privateKeyBox: "",
  };
}

export async function restoreKeypair(
  keyRecord: KeyRecord,
  password: string
): Promise<Keypair> {
  const decryptedKey = await decryptData(keyRecord.privateKeyBox, password);
  const privateKey = Uint8Array.from(bs58.decode(decryptedKey).slice(0, 64));
  const keypair = Keypair.fromSecretKey(privateKey);
  return keypair;
}

export type KeyRecord = {
  name: string;
  publicKey: string;
  viewOnly: boolean;
  privateKeyBox: string;
};
