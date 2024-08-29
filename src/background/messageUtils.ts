import { BaseCommand, CommandSource } from "../command/baseCommand";

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return tab;
}

export async function sendMsgToContentScript(msg: BaseCommand): Promise<any> {
  console.log("[message] send message from background to content script");
  const tab = await getActiveTab();
  if (tab.id) {
    const ret = await chrome.tabs.sendMessage(tab.id, {
      ...msg,
      from: CommandSource.BACKGROUND,
    });
    console.log(
      "[message] receive reply from content script at background",
      ret
    );
    return ret;
  }
}
