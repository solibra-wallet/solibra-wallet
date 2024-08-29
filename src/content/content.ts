import { CommandSource } from "../command/baseCommand";
import { ChangedAccountCommandFactory } from "../command/changedAccountCommand";
import { ForwardToInjectScriptCommandFactory } from "../command/forwardToInjectScriptCommand";
import { sendMsgToInjectScript } from "./messageUtils";

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

          // content-script also should unwrap to handle
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
  window.addEventListener("message", (event) => {
    if (
      event.source === window &&
      event.data.from === CommandSource.INJECT_SCRIPT
    ) {
      console.log(
        "[message] content script received message from inject",
        event
      );
    }
  });
}

function injectScript(scriptName: string) {
  try {
    const container = document.head || document.documentElement;

    const idTag = document.createElement("div");
    idTag.setAttribute("id", "msg-passing-test");
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
