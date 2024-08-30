import { CommandSource } from "../command/baseCommand";
import { ChangedAccountCommandFactory } from "../command/changedAccountCommand";
import { ConnectRequestCommandFactory } from "../command/connectRequestCommand";
import { ConnectResponseCommandFactory } from "../command/connectResponseCommand";
import { ForwardToBackgroundCommandTypeFactory } from "../command/forwardToBackgroundCommand";
import { ForwardToInjectScriptCommandFactory } from "../command/forwardToInjectScriptCommand";
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
      sendResponse({ response: "pong from content script" });

      let currentCommand = request;

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
            return; // quit
          }
        }
      }
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

      let currentCommand = event.data;

      if (ForwardToBackgroundCommandTypeFactory.isCommand(currentCommand)) {
        console.log(
          "[message] content script received forward to background command",
          currentCommand
        );
        const command =
          ForwardToBackgroundCommandTypeFactory.tryFrom(currentCommand);
        if (command && command.forwardCommand) {
          await sendMsgToBackground(command.forwardCommand);

          // see if content-script also audience and wanna unwrap to handle
          if (command.receivers.includes(CommandSource.CONTENT_SCRIPT)) {
            currentCommand = command.forwardCommand;
          } else {
            return; // quit
          }
        }
      }

      if (ConnectRequestCommandFactory.isCommand(currentCommand)) {
        const ret = await sendMsgToBackground(
          ConnectRequestCommandFactory.buildNew({
            from: CommandSource.CONTENT_SCRIPT,
          })
        );
        await sendMsgToInjectScript(
          ConnectResponseCommandFactory.buildNew({
            from: CommandSource.CONTENT_SCRIPT,
            publicKey: ret.publicKey,
          })
        );
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
