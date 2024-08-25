import { createStore } from "zustand/vanilla";
import { create, useStore } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { KeyRecord } from "./keyRecord";
import { StateCreator } from "zustand";
import { sendMsgToBackground } from "../content/message-utils";

// Custom storage object
const asyncLocalStorage: StateStorage = {
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

type KeysStoreDataType = {
  keys: KeyRecord[];
  keyIndex: number;
  currentKey: KeyRecord | null;
  password: string | null;
};

type KeysStoreActionsType = {
  addKey: (key: KeyRecord) => void;
  removeKey: (i: number) => void;
  selectKey: (i: number) => void;
};

type KeysStoreType = KeysStoreDataType & KeysStoreActionsType;

const baseKeysStore: StateCreator<
  KeysStoreType,
  [],
  [["zustand/persist", unknown]]
> = persist(
  (set, get) => ({
    keys: [],
    keyIndex: 0,
    currentKey: null,
    password: "Qwer1234!",
    addKey: (key: KeyRecord) => {
      if (!key) {
        return;
      }
      const keys = [...get().keys, key];
      const currentKey = get().currentKey ?? keys[0];
      set({ keys, currentKey });

      // sendMsgToBackground({
      //   command: "refreshKeysStore",
      // });
    },
    removeKey: (i: number) => {
      const keys = get().keys.filter((_, index) => index !== i);
      const keyIndex = get().keyIndex > keys.length - 1 ? 0 : get().keyIndex;
      const currentKey = keys[keyIndex] ?? null;
      set({ keys, keyIndex, currentKey });
      // sendMsgToBackground({
      //   command: "refreshKeysStore",
      // });
    },
    selectKey: (i: number) => {
      let currentKey = get().keys[i];
      if (currentKey) {
        set({ keyIndex: i, currentKey });
        return;
      }
      currentKey = get().keys[0] ?? null;
      set({ keyIndex: 0, currentKey });
      // sendMsgToBackground({
      //   command: "refreshKeysStore",
      // });
    },
  }),
  {
    name: "keys-storage", // unique name
    storage: createJSONStorage(() => asyncLocalStorage),
  }
);

export const vanillaKeysStore = createStore<KeysStoreType>()(baseKeysStore);

export function useKeysStore(): KeysStoreType;
export function useKeysStore<T>(selector: (state: KeysStoreType) => T): T;
export function useKeysStore<T>(selector?: (state: KeysStoreType) => T) {
  return useStore(vanillaKeysStore, selector!);
}
