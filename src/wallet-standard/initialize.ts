import { registerWallet } from "./register";
import { SolibraStandardWallet } from "./wallet";
import type { Solibra } from "./window";

export function initialize(solibraWallet: SolibraStandardWallet): void {
  registerWallet(solibraWallet);
}
