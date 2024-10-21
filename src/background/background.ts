import { CommandSource } from "../command/base/baseCommandType";
import { ChangedAccountCommandFactory } from "../command/changedAccountCommand";
import { ConnectRequestCommandFactory } from "../command/operationRequest/connectRequestCommand";
import { ForwardToInjectScriptCommandFactory } from "../command/transport/forwardToInjectScriptCommand";
import { RefreshKeysStoreCommandFactory } from "../command/storeSync/refreshKeysStoreCommand";
import { SignMessageRequestCommandFactory } from "../command/operationRequest/signMessageRequestCommand";
import { envStore } from "../store/envStore";
import { vanillaKeysStore } from "../store/keysStore";
import { operationStore } from "../store/operationStore";
import { sendMsgToContentScript } from "./messageUtils";
import { SignAndSendTxRequestCommandFactory } from "../command/operationRequest/signAndSendTxRequestCommand";
import { SignTxRequestCommandFactory } from "../command/operationRequest/signTxRequestCommand";
import { OperationRequestCommandType } from "../command/base/operationRequestCommandType";
import { configConstants } from "../common/configConstants";
import { settingsStore } from "../store/settingsStore";
import {
  decryptMessage,
  encryptMessage,
  exportPrivateKey,
  exportPublicKey,
  generateKeyPair,
  importPrivateKey,
  importPublicKey,
} from "../common/asymEncryptionUtils";
import { bytesToStr, strToBytes } from "../common/encodingUtils";

envStore.getState().setEnv("BACKGROUND");

function openPopout(top: number = 0, left: number = 0) {
  chrome.windows.create({
    url: "ui/popout/popout.html",
    type: "popup",
    top: top,
    left: left,
    width: configConstants.popout.windowWidth,
    height: configConstants.popout.windowHeight,
  });
}

async function placeOperation(command: OperationRequestCommandType) {
  await operationStore.persist.rehydrate();
  operationStore.getState().setOperation({
    operation: command.operation,
    requestPayload: command.requestPayload,
    requestId: command.requestId,
    requestPublicKey: command.requestPublicKey,
    site: command.site,
  });
}

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
          sendResponse({});
          return;
        }
        await placeOperation(command);
        openPopout(request.top, request.left);
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
          sendResponse({});
          return;
        }
        await placeOperation(command);
        openPopout(request.top, request.left);
        sendResponse({});
        return;
      }

      if (SignAndSendTxRequestCommandFactory.isCommand(request)) {
        console.log(
          "[message] background received sign and send tx request",
          request
        );
        const command = SignAndSendTxRequestCommandFactory.tryFrom(request);
        if (!command) {
          sendResponse({});
          return;
        }
        await placeOperation(command);
        openPopout(request.top, request.left);
        sendResponse({});
        return;
      }

      if (SignTxRequestCommandFactory.isCommand(request)) {
        console.log("[message] background received sign tx request", request);
        const command = SignTxRequestCommandFactory.tryFrom(request);
        if (!command) {
          sendResponse({});
          return;
        }
        await placeOperation(command);
        openPopout(request.top, request.left);
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

chrome.runtime.onInstalled.addListener(async () => {
  await settingsStore.persist.rehydrate();
  console.log("chrome.runtime.onInstalled", settingsStore.getState());
  if (!settingsStore.getState().isDeviceKeysInitialized()) {
    const encryptKeyPair = await generateKeyPair();
    const exportedPublicKey = await exportPublicKey(encryptKeyPair.publicKey);
    const exportedPrivateKey = await exportPrivateKey(
      encryptKeyPair.privateKey
    );
    settingsStore
      .getState()
      .setDeviceKeys(exportedPrivateKey, exportedPublicKey);
  }
});

registerMessageListeners();
