import { registerWallet } from "./register";
import { SolibraWallet } from "./wallet";
import type { Solibra } from "./window";

export function initialize(solibra: Solibra): void {
  registerWallet(new SolibraWallet(solibra));
}
