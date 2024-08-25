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

export async function sendMsgToBackground(msg: any): Promise<any> {
  console.log("[message] send message from injected script to background");
  const extensionId = getExtensionId();

  return new Promise((resolve, reject) => {
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
          return reject(chrome.runtime.lastError);
        }
        console.log(
          "[message] receive reply from background at injected script",
          ret
        );
        return resolve(ret);
      }
    );
  });
}

export async function sendMsgToContentScript(msg: any) {
  // send msg: injected script -> content script
  console.log("[message] send message from injected script to content script");
  window.postMessage({
    ...msg,
    from: "injected-script",
  });
}
