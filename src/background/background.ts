import { CommandSource } from "../command/baseCommandType";
import { ChangedAccountCommandFactory } from "../command/changedAccountCommand";
import { ConnectRequestCommandFactory } from "../command/connectRequestCommand";
import { ForwardToInjectScriptCommandFactory } from "../command/forwardToInjectScriptCommand";
import { RefreshKeysStoreCommandFactory } from "../command/refreshKeysStoreCommand";
import { RefreshOperationStoreCommandFactory } from "../command/refreshOperationStoreCommand";
import { SignMessageRequestCommandFactory } from "../command/signMessageRequestCommand";
import { envStore } from "../store/envStore";
import { vanillaKeysStore } from "../store/keysStore";
import { operationStore } from "../store/operationStore";
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
      } else {
        console.log(
          "[message] background received message from content",
          request
        );
      }

      if (ConnectRequestCommandFactory.isCommand(request)) {
        // chrome.action.openPopup();
        // sendResponse({
        //   publicKey: vanillaKeysStore.getState().currentKey?.publicKey,
        // });
        console.log("[message] background received connect request", request);
        const command = ConnectRequestCommandFactory.tryFrom(request);
        if (!command) {
          return;
        }
        await operationStore.persist.rehydrate();
        operationStore.getState().setOperation({
          operation: command.operation,
          requestPayload: command.operationRequestPayload,
          requestId: command.operationRequestId,
          requestPublicKey: command.operationRequestPublicKey,
        });
        // await sendMsgToContentScript(
        //   RefreshOperationStoreCommandFactory.buildNew({
        //     from: CommandSource.BACKGROUND,
        //   }),
        //   true
        // );
        chrome.windows.create({
          url: "popup/popout.html",
          type: "popup",
          top: request.top ?? 0,
          left: request.left ?? 0,
          width: 600,
          height: 800,
        });
        sendResponse({});
        return;
      }

      if (SignMessageRequestCommandFactory.isCommand(request)) {
        console.log(
          "[message] background received sign message request",
          request
        );
        const command = SignMessageRequestCommandFactory.tryFrom(request);
        if (!command) {
          return;
        }
        await operationStore.persist.rehydrate();
        operationStore.getState().setOperation({
          operation: command.operation,
          requestPayload: command.operationRequestPayload,
          requestId: command.operationRequestId,
          requestPublicKey: command.operationRequestPublicKey,
        });
        // await sendMsgToContentScript(
        //   RefreshOperationStoreCommandFactory.buildNew({
        //     from: CommandSource.BACKGROUND,
        //   }),
        //   true
        // );
        chrome.windows.create({
          url: "popup/popout.html",
          type: "popup",
          top: request.top ?? 0,
          left: request.left ?? 0,
          width: 600,
          height: 800,
        });
        sendResponse({});
        return;
      }

      if (RefreshKeysStoreCommandFactory.isCommand(request)) {
        console.log("[message] rehydrate keys store");
        const oldCurrentKey = vanillaKeysStore.getState().currentKey?.publicKey;
        await vanillaKeysStore.persist.rehydrate();
        sendResponse({});
        const newCurrentKey = vanillaKeysStore.getState().currentKey?.publicKey;

        if (oldCurrentKey !== newCurrentKey) {
          // update to UI (inject script) to notify wallet account changed
          await sendMsgToContentScript(
            ForwardToInjectScriptCommandFactory.buildNew({
              from: CommandSource.BACKGROUND,
              receivers: [
                CommandSource.CONTENT_SCRIPT,
                CommandSource.INJECT_SCRIPT,
              ],
              forwardCommand: ChangedAccountCommandFactory.buildNew({
                from: CommandSource.BACKGROUND,
                publicKey: newCurrentKey ?? null,
              }),
            }),
            true
          );
        }
        return;
      }

      console.log("[message] receive from popup script", request);
      sendResponse({ response: "pong from background" });
    }
  );

  // listen message from other extension or inject script
  chrome.runtime.onMessageExternal.addListener(
    (request, sender, sendResponse) => {
      console.log(
        "[message] receive from other extension or inject script",
        request
      );
      // if (ConnectRequestCommandFactory.isCommand(request)) {
      //   // chrome.action.openPopup();
      //   sendResponse({
      //     publicKey: vanillaKeysStore.getState().currentKey?.publicKey,
      //   });
      //   return;
      // }

      sendResponse({ response: "pong from background" });
    }
  );
}

registerMessageListeners();
