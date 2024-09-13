import {
  BaseCommandType,
  CommandSource,
} from "../command/base/baseCommandType";

export async function sendMsgToBackground(msg: BaseCommandType): Promise<any> {
  console.log("[message] send message from content script to background");
  const ret = await chrome.runtime.sendMessage({
    ...msg,
    from: CommandSource.CONTENT_SCRIPT,
  });
  console.log("[message] receive reply from background at content script", ret);
  return ret;
}

export async function sendMsgToInjectScript(msg: BaseCommandType) {
  console.log("[message] send message from content script to inject script");
  window.postMessage({
    ...msg,
    from: CommandSource.CONTENT_SCRIPT,
  });
}
