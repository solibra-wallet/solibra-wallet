function getExtensionId() {
  return document?.getElementById("msg-passing-test")?.getAttribute("data");
}

export function registerMessageListeners() {
  // declare message listener from content script
  window.addEventListener("message", (event) => {
    if (event.source === window && event.data.from === "content-script") {
      console.log(
        "[message] injected script received message from content script",
        event.data
      );
    }
  });
}

export async function sendMsgToBackground(msg: any) {
  console.log("[message] send message from injected script to background");
  const extensionId = getExtensionId();
  // 於 injected script 使用 chrome message api 時
  // 需注意這邊還沒有 promise 的寫法
  chrome.runtime.sendMessage(
    extensionId,
    {
      ...msg,
      from: "injected-script",
    },
    (ret) => {
      if (ret === undefined && chrome.runtime.lastError) {
        console.error(
          "[message] send message from injected script to background error",
          chrome.runtime.lastError
        );
        return;
      }
      console.log(
        "[message] receive reply from background at injected script",
        ret
      );
    }
  );
}

export async function sendMsgToContentScript(msg: any) {
  // send msg: injected script -> content script
  console.log("[message] send message from injected script to content script");
  window.postMessage({
    ...msg,
    from: "injected-script",
  });
}
