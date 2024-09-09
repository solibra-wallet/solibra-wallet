import {
  encodeUTF8,
  decodeUTF8,
  encodeBase64,
  decodeBase64,
} from "tweetnacl-util";
// import { Base64 } from "js-base64";

export function base64Encode(str: string): string {
  return encodeBase64(decodeUTF8(str));
  // return Base64.encode(str);
}

export function base64Decode(str: string): string {
  return encodeUTF8(decodeBase64(str));
  // return Base64.decode(str);
}

export function base64EncodeFromUint8Array(uint8Array: Uint8Array): string {
  return encodeBase64(uint8Array);
  // return Base64.fromUint8Array(uint8Array);
}

export function base64DecodeToUint8Array(str: string): Uint8Array {
  return decodeBase64(str);
  // return Base64.toUint8Array(str);
}

export function utf8StringToUint8Array(str: string): Uint8Array {
  return decodeUTF8(str);
}

export function utf8Uint8ArrayToString(uint8Array: Uint8Array): string {
  return encodeUTF8(uint8Array);
}
