import { CommandSource } from "../command/base/baseCommandType";
import { ConnectRequestCommandFactory } from "../command/operationRequest/connectRequestCommand";
// import { ConnectResponseCommandFactory } from "../command/connectResponseCommand";
import { ForwardToInjectScriptCommandFactory } from "../command/transport/forwardToInjectScriptCommand";
import { SignMessageRequestCommandFactory } from "../command/operationRequest/signMessageRequestCommand";
import { sendMsgToBackground, sendMsgToInjectScript } from "./messageUtils";
import { SignAndSendTxRequestCommandFactory } from "../command/operationRequest/signAndSendTxRequestCommand";
import { SignTxRequestCommandFactory } from "../command/operationRequest/signTxRequestCommand";
import { configConstants } from "../common/configConstants";

function getDefaultPopoutWindowPositionParams() {
  return {
    left:
      window.screenLeft +
      window.outerWidth -
      configConstants.popout.windowWidth,
    top: window.screenTop,
  };
}

function registerMessageListeners() {
  // declare message listener from background or popup script
  chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
      console.log(
        "[message] content script received message from background or popup script",
        request,
        sender
      );
      // sendResponse({ response: "pong from content script" });

      let currentCommand = request;

      // handle forward to inject script command
      if (ForwardToInjectScriptCommandFactory.isCommand(currentCommand)) {
        console.log(
          "[message] content script received forward to inject script command",
          currentCommand
        );
        const command =
          ForwardToInjectScriptCommandFactory.tryFrom(currentCommand);
        if (command && command.forwardCommand) {
          await sendMsgToInjectScript(command.forwardCommand);

          // see if content-script also audience and wanna unwrap to handle
          if (command.receivers.includes(CommandSource.CONTENT_SCRIPT)) {
            currentCommand = command.forwardCommand;
          } else {
            sendResponse({});
            return; // quit
          }
        }
      }

      sendResponse({});
    }
  );

  // declare message listener from inject script
  window.addEventListener("message", async (event) => {
    if (
      event.source === window &&
      event.data.from === CommandSource.INJECT_SCRIPT
    ) {
      console.log(
        "[message] content script received message from inject",
        event
      );

      const currentCommand = event.data;

      if (ConnectRequestCommandFactory.isCommand(currentCommand)) {
        await sendMsgToBackground({
          ...currentCommand,
          ...getDefaultPopoutWindowPositionParams(),
        });
        return;
      }

      if (SignMessageRequestCommandFactory.isCommand(currentCommand)) {
        console.log(
          "[message] content script received sign message request command",
          currentCommand
        );
        // ask background for request sign message, and get back result
        await sendMsgToBackground({
          ...currentCommand,
          ...getDefaultPopoutWindowPositionParams(),
        });
        return;
      }

      if (SignAndSendTxRequestCommandFactory.isCommand(currentCommand)) {
        console.log(
          "[message] content script received sign and send tx request command",
          currentCommand
        );
        // ask background for request sign and send tx, and get back result
        await sendMsgToBackground({
          ...currentCommand,
          ...getDefaultPopoutWindowPositionParams(),
        });
        return;
      }

      if (SignTxRequestCommandFactory.isCommand(currentCommand)) {
        console.log(
          "[message] content script received sign tx request command",
          currentCommand
        );
        // ask background for request sign tx, and get back result
        await sendMsgToBackground({
          ...currentCommand,
          ...getDefaultPopoutWindowPositionParams(),
        });
        return;
      }
    }
  });
}

function injectScript(scriptName: string) {
  try {
    const container = document.head || document.documentElement;

    const idTag = document.createElement("div");
    idTag.setAttribute("id", "solibra-extension-id");
    idTag.setAttribute("data", chrome.runtime.id);
    container.appendChild(idTag);

    const scriptTag = document.createElement("script");
    scriptTag.setAttribute("async", "true");
    scriptTag.setAttribute("type", "module");
    scriptTag.src = chrome.runtime.getURL(scriptName);
    container.insertBefore(scriptTag, container.children[0]);
    container.removeChild(scriptTag);
  } catch (error) {
    console.error("provider injection failed.", error);
  }
}

registerMessageListeners();
injectScript("inject.js");
