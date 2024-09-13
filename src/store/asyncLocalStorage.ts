import { StateStorage } from "zustand/middleware";
import { envStore } from "./envStore";
import { sendMsgToBackground } from "../content/messageUtils";
import { sendMsgToContentScript } from "../background/messageUtils";
import { RefreshKeysStoreCommandFactory } from "../command/storeSync/refreshKeysStoreCommand";
import { CommandSource } from "../command/base/baseCommandType";
import { RefreshOperationStoreCommandFactory } from "../command/storeSync/refreshOperationStoreCommand";

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

export enum STORE_SCOPE {
  KEYS = "keys",
  OPERATION = "operation",
}

export const syncStoreAcrossRuntime = async (scopes: STORE_SCOPE[]) => {
  console.log("[store] propogate reload store", envStore.getState().env);
  if (envStore.getState().env === "POPUP_SCRIPT") {
    if (scopes.includes(STORE_SCOPE.KEYS)) {
      await sendMsgToBackground(
        RefreshKeysStoreCommandFactory.buildNew({
          from: CommandSource.POPUP_SCRIPT,
        })
      );
    }
    if (scopes.includes(STORE_SCOPE.OPERATION)) {
      await sendMsgToBackground(
        RefreshOperationStoreCommandFactory.buildNew({
          from: CommandSource.POPUP_SCRIPT,
        })
      );
    }
  } else if (envStore.getState().env === "BACKGROUND") {
    if (scopes.includes(STORE_SCOPE.KEYS)) {
      await sendMsgToContentScript(
        RefreshKeysStoreCommandFactory.buildNew({
          from: CommandSource.BACKGROUND,
        })
      );
    }
    if (scopes.includes(STORE_SCOPE.OPERATION)) {
      await sendMsgToContentScript(
        RefreshOperationStoreCommandFactory.buildNew({
          from: CommandSource.BACKGROUND,
        })
      );
    }
  }
};
