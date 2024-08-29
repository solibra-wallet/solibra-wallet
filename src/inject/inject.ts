import { CommandSource } from "../command/baseCommand";
import { ChangedAccountCommandFactory } from "../command/changedAccountCommand";
import { initialize } from "../wallet-standard/initialize";
import { SolibraWallet } from "../wallet-standard/wallet";
import { SolibraImpl } from "./solibraImpl";

console.log("inject script loaded");

const solibraImpl = new SolibraImpl();
const solibraWallet = new SolibraWallet(solibraImpl);
initialize(solibraWallet);

function registerMessageListeners() {
  // declare message listener from content script
  window.addEventListener("message", async (event) => {
    if (
      event.source === window &&
      event.data.from === CommandSource.CONTENT_SCRIPT
    ) {
      console.log(
        "[message] inject script received message from content script",
        event.data
      );

      if (ChangedAccountCommandFactory.isCommand(event.data)) {
        console.log(
          "[message] inject script received changed account command",
          event.data
        );
        solibraImpl.reloadAccount();
      }
    }
  });
}

registerMessageListeners();
