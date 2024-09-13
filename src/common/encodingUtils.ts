import {
  encodeUTF8,
  decodeUTF8,
  encodeBase64,
  decodeBase64,
} from "tweetnacl-util";
import { Buffer } from "buffer";

export function base64Encode(str: string): string {
  return encodeBase64(decodeUTF8(str));
}

export function base64Decode(str: string): string {
  return encodeUTF8(decodeBase64(str));
}

export function strToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function bytesToStr(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

export function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, "hex"));
}
