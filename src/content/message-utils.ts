export function registerMessageListeners() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(
      "[message] content script received message from background",
      request,
      sender
    );
    sendResponse({ response: "pong from content script" });
  });

  window.addEventListener("message", (event) => {
    if (event.source === window && event.data.from === "injected-script") {
      console.log(
        "[message] content script received message from inject",
        event
      );
    }
  });
}

export async function sendMsgToBackground(msg: any) {
  console.log("[message] send message from content script to background");
  const ret = await chrome.runtime.sendMessage({
    ...msg,
    from: "content-script",
  });
  console.log("[message] receive reply from background at content script", ret);
}

export async function sendMsgToInjectScript(msg: any) {
  console.log("[message] send message from content script to injected script");
  window.postMessage({
    ...msg,
    from: "content-script",
  });
}
