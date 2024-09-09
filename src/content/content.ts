import { CommandSource } from "../command/baseCommandType";
import { ChangedAccountCommandFactory } from "../command/changedAccountCommand";
import { ConnectRequestCommandFactory } from "../command/connectRequestCommand";
import { ConnectResponseCommandFactory } from "../command/connectResponseCommand";
import { ForwardToInjectScriptCommandFactory } from "../command/forwardToInjectScriptCommand";
import { SignMessageRequestCommandFactory } from "../command/signMessageRequestCommand";
import { sendMsgToBackground, sendMsgToInjectScript } from "./messageUtils";

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
        // console.log(
        //   "[message] content script received connect request command",
        //   currentCommand
        // );
        // // ask background for request connect, and get back result
        // const ret = await sendMsgToBackground(
        //   ConnectRequestCommandFactory.buildNew({
        //     from: CommandSource.CONTENT_SCRIPT,
        //   })
        // );
        // // notify inject script to update public key
        // await sendMsgToInjectScript(
        //   ConnectResponseCommandFactory.buildNew({
        //     from: CommandSource.CONTENT_SCRIPT,
        //     publicKey: ret.publicKey,
        //   })
        // );
        // return;
        await sendMsgToBackground({
          ...currentCommand,
          left: window.screenLeft + window.outerWidth - 600,
          top: window.screenTop,
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
          left: window.screenLeft + window.outerWidth - 600,
          top: window.screenTop,
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
