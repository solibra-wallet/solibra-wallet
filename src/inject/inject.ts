import { PublicKey } from "@solana/web3.js";
import { CommandSource } from "../command/baseCommand";
import { ChangedAccountCommandFactory } from "../command/changedAccountCommand";
import {
  ConnectResponseCommandFactory,
  ConnectResponseCommandType,
} from "../command/connectResponseCommand";
import { initialize } from "../wallet-standard/initialize";
import { SolibraStandardWallet } from "../wallet-standard/wallet";
import { SolibraWallet } from "./solibraWallet";

console.log("inject script loaded");

const solibraWallet = new SolibraWallet();
const solibraStandardWallet = new SolibraStandardWallet(solibraWallet);
initialize(solibraStandardWallet);

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

      // handle connect response command
      if (ConnectResponseCommandFactory.isCommand(event.data)) {
        console.log(
          "[message] inject script received connect response command",
          event.data
        );
        solibraWallet.setPublicKey(
          new PublicKey((event.data as ConnectResponseCommandType).publicKey)
        );
        return;
      }

      // handle changed account command
      if (ChangedAccountCommandFactory.isCommand(event.data)) {
        console.log(
          "[message] inject script received changed account command",
          event.data
        );
        const command = ChangedAccountCommandFactory.tryFrom(event.data);
        if (!command) {
          return;
        }

        // update wallet account & reload
        solibraWallet.setPublicKey(
          command.publicKey ? new PublicKey(command.publicKey) : null
        );
        solibraWallet.reloadAccount();
        return;
      }
    }
  });
}

registerMessageListeners();
