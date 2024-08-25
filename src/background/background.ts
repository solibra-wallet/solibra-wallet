import { vanillaKeysStore } from "../store/keysStore";

function registerMessageListeners() {
  // listen message from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (sender.tab) {
      console.log(
        `[message] background received message from content ${sender.tab.url}`,
        request
      );
      sendResponse({ response: "pong from background" });
    } else {
      console.log("[message] receive from popup script", request);
      sendResponse({ response: "pong from background" });
    }
  });

  // listen message from other extension or injected script
  chrome.runtime.onMessageExternal.addListener(
    (request, sender, sendResponse) => {
      console.log(
        "[message] receive from other extension or injected script",
        request
      );
      if ((request as any).command === "connect") {
        // chrome.action.openPopup();
        (async () => {
          sendResponse({
            publicKey: vanillaKeysStore.getState().currentKey?.publicKey,
          });
        })();

        return;
      }

      if ((request as any).command === "refreshKeysStore") {
        (async () => {
          await vanillaKeysStore.persist.rehydrate();
          sendResponse({});
        })();
        return;
      }
      sendResponse({ response: "pong from background" });
    }
  );
}

registerMessageListeners();
