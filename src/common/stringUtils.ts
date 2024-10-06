import { PublicKey } from "@solana/web3.js";

export const toAddressShortName = (address: PublicKey | string): string => {
  const addressStr = address.toString();
  return `${addressStr.slice(0, 4)}...${addressStr.slice(-4)}`;
};
