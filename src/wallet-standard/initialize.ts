import { registerWallet } from "./register";
import { SolibraWallet } from "./wallet";
import type { Solibra } from "./window";

export function initialize(solibraWallet: SolibraWallet): void {
  registerWallet(solibraWallet);
}
