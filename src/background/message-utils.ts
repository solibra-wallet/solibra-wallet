async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return tab;
}

export function registerMessageListeners() {
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
        chrome.action.openPopup();
      }
      sendResponse({ response: "pong from background" });
    }
  );
}

export async function sendMsgToContentScript(msg: any) {
  console.log("[message] send message from background to content script");
  const tab = await getActiveTab();
  if (tab.id) {
    const ret = await chrome.tabs.sendMessage(tab.id, msg);
    console.log(
      "[message] receive reply from content script at background",
      ret
    );
  }
}
