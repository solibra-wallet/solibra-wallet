import { BaseCommandType, CommandSource } from "../command/baseCommand";

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return tab;
}

export async function sendMsgToContentScript(
  msg: BaseCommandType,
  broadcast = false
): Promise<any> {
  console.log("[message] send message from background to content script");
  const tabs = broadcast
    ? await chrome.tabs.query({})
    : await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  tabs.map(async (tab) => {
    if (tab?.id) {
      try {
        const ret = await chrome.tabs.sendMessage(tab.id, {
          ...msg,
          from: CommandSource.BACKGROUND,
        });
        console.log(
          "[message] receive reply from content script at background",
          ret
        );
        return ret;
      } catch (e) {
        console.error("[message] error sending message to content script", e);
      }
    }
  });
}
