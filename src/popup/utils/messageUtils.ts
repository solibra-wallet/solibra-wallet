import { BaseCommand, CommandSource } from "../../command/baseCommand";

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return tab;
}

// send msg: popup script -> background
async function sendMsgToBackground(msg: BaseCommand) {
  console.log("[message] send message from popup script to background");
  const ret = await chrome.runtime.sendMessage({
    ...msg,
    from: CommandSource.POPUP_SCRIPT,
  });
  console.log("[message] receive reply from background at popup script", ret);
}

// send msg: popup script -> content script
async function sendMsgToContentScript(msg: BaseCommand) {
  console.log("[message] send message from popup script to content script");
  const tab = await getActiveTab();
  if (!tab.id) {
    console.error("[message] tab id not found");
    return;
  }
  const ret = await chrome.tabs.sendMessage(tab.id, {
    ...msg,
    from: CommandSource.POPUP_SCRIPT,
  });
  console.log(
    "[message] receive reply from content script at popup script",
    ret
  );
}
