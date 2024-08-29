import { CommandSource } from "../command/baseCommand";
import { ChangedAccountCommandFactory } from "../command/changedAccountCommand";
import { ConnectRequestCommandFactory } from "../command/connectRequestCommand";
import { ForwardToInjectScriptCommandFactory } from "../command/forwardToInjectScriptCommand";
import { RefreshKeysStoreCommandFactory } from "../command/refreshKeysStoreCommand";
import { envStore, vanillaKeysStore } from "../store/keysStore";
import { sendMsgToContentScript } from "./messageUtils";

envStore.getState().setEnv("BACKGROUND");

function registerMessageListeners() {
  // listen message from content script
  chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
      if (sender.tab) {
        console.log(
          `[message] background received message from content ${sender.tab.url}`,
          request
        );

        sendResponse({ response: "pong from background" });
      } else {
        if (RefreshKeysStoreCommandFactory.isCommand(request)) {
          console.log("[message] rehydrate keys store");
          await vanillaKeysStore.persist.rehydrate();
          sendResponse({});
          await sendMsgToContentScript(
            ForwardToInjectScriptCommandFactory.buildNew(
              CommandSource.BACKGROUND,
              [CommandSource.CONTENT_SCRIPT, CommandSource.INJECT_SCRIPT],
              ChangedAccountCommandFactory.buildNew(CommandSource.BACKGROUND)
            )
          );
          return;
        }

        console.log("[message] receive from popup script", request);
        sendResponse({ response: "pong from background" });
      }
    }
  );

  // listen message from other extension or inject script
  chrome.runtime.onMessageExternal.addListener(
    (request, sender, sendResponse) => {
      console.log(
        "[message] receive from other extension or inject script",
        request
      );
      if (ConnectRequestCommandFactory.isCommand(request)) {
        // chrome.action.openPopup();
        sendResponse({
          publicKey: vanillaKeysStore.getState().currentKey?.publicKey,
        });
        return;
      }

      sendResponse({ response: "pong from background" });
    }
  );
}

registerMessageListeners();
