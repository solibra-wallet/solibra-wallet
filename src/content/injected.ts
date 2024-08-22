import { initialize } from "../wallet-standard/initialize";
import { SolibraWallet } from "../common/solibra-wallet";

console.log("content script loaded");

const solibraWallet = new SolibraWallet();
initialize(solibraWallet);
