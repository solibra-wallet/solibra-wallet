import {
  BaseCommandType,
  CommandSource,
} from "../../command/base/baseCommandType";

async function getActiveTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    // lastFocusedWindow: true,
  });
  return tabs[0];
}

// send msg: popup script -> background
export async function sendMsgToBackground(msg: BaseCommandType) {
  console.log("[message] send message from popup script to background");
  const ret = await chrome.runtime.sendMessage({
    ...msg,
    from: CommandSource.POPUP_SCRIPT,
  });
  console.log("[message] receive reply from background at popup script", ret);
}

// send msg: popup script -> content script
export async function sendMsgToContentScript(msg: BaseCommandType) {
  try {
    console.log("[message] send message from popup script to content script");
    const tab = await getActiveTab();
    if (!tab?.id) {
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
  } catch (e) {
    console.error("[message] error sending message to content script", e);
  }
}
