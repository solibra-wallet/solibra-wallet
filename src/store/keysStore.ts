import { createStore } from "zustand/vanilla";
import { create, useStore } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { KeyRecord } from "./keyRecord";
import { StateCreator } from "zustand";
import { sendMsgToBackground } from "../content/messageUtils";
import { RefreshKeysStoreCommandFactory } from "../command/refreshKeysStoreCommand";
import { CommandSource } from "../command/baseCommandType";
import { sendMsgToContentScript } from "../background/messageUtils";
import { envStore } from "./envStore";
import { asyncLocalStorage, syncStoreAcrossRuntime } from "./asyncLocalStorage";

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

      syncStoreAcrossRuntime();
    },
    removeKey: (i: number) => {
      const oldKeyIndex = get().keyIndex;
      if (i > get().keys.length - 1) {
        return;
      }

      let newKeyIndex = 0;
      if (oldKeyIndex > i) {
        newKeyIndex = oldKeyIndex - 1;
      } else if (oldKeyIndex === i) {
        newKeyIndex = 0;
      } else {
        newKeyIndex = oldKeyIndex;
      }

      const keys = get().keys.filter((_, index) => index !== i);
      const currentKey = keys[newKeyIndex] ?? null;
      set({ keys, keyIndex: newKeyIndex, currentKey });

      syncStoreAcrossRuntime();
    },
    selectKey: (i: number) => {
      let currentKey = get().keys[i];
      if (currentKey) {
        set({ keyIndex: i, currentKey });
      } else {
        currentKey = get().keys[0] ?? null;
        set({ keyIndex: 0, currentKey });
      }
      syncStoreAcrossRuntime();
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
