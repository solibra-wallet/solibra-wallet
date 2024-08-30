import { Base64 } from "js-base64";

export function base64Encode(str: string): string {
  return Base64.encode(str);
}

export function base64Decode(str: string): string {
  return Base64.decode(str);
}
