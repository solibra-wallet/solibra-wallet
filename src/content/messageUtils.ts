import { BaseCommand, CommandSource } from "../command/baseCommand";

export async function sendMsgToBackground(msg: BaseCommand) {
  console.log("[message] send message from content script to background");
  const ret = await chrome.runtime.sendMessage({
    ...msg,
    from: CommandSource.CONTENT_SCRIPT,
  });
  console.log("[message] receive reply from background at content script", ret);
}

export async function sendMsgToInjectScript(msg: BaseCommand) {
  console.log("[message] send message from content script to inject script");
  window.postMessage({
    ...msg,
    from: CommandSource.CONTENT_SCRIPT,
  });
}
