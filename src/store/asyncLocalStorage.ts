import { StateStorage } from "zustand/middleware";
import { envStore } from "./envStore";
import { sendMsgToBackground } from "../content/messageUtils";
import { sendMsgToContentScript } from "../background/messageUtils";
import { RefreshKeysStoreCommandFactory } from "../command/refreshKeysStoreCommand";
import { CommandSource } from "../command/baseCommandType";
import { RefreshOperationStoreCommandFactory } from "../command/refreshOperationStoreCommand";

// Custom storage object
export const asyncLocalStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    console.log(name, "has been retrieved");
    const localStore = await chrome.storage.local.get(name);
    return localStore[name] ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    console.log(name, "with value", value, "has been saved");
    await chrome.storage.local.set({ [name]: value });
  },
  removeItem: async (name: string): Promise<void> => {
    console.log(name, "has been deleted");
    await chrome.storage.local.remove(name);
  },
};

export const syncStoreAcrossRuntime = async () => {
  console.log("[store] propogate reload store", envStore.getState().env);
  if (envStore.getState().env === "POPUP_SCRIPT") {
    await sendMsgToBackground(
      RefreshKeysStoreCommandFactory.buildNew({
        from: CommandSource.POPUP_SCRIPT,
      })
    );
    await sendMsgToBackground(
      RefreshOperationStoreCommandFactory.buildNew({
        from: CommandSource.POPUP_SCRIPT,
      })
    );
  } else if (envStore.getState().env === "BACKGROUND") {
    await sendMsgToContentScript(
      RefreshKeysStoreCommandFactory.buildNew({
        from: CommandSource.BACKGROUND,
      })
    );
    await sendMsgToContentScript(
      RefreshOperationStoreCommandFactory.buildNew({
        from: CommandSource.BACKGROUND,
      })
    );
  }
};
