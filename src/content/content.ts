import { registerMessageListeners } from "./message-utils";

registerMessageListeners();

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

injectScript("injected.js");
