import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { KeyRecord } from "./keyRecord";

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

type KeysStorageType = {
  keys: KeyRecord[];
  keyIndex: number;
  currentKey: KeyRecord | null;
  password: string | null;
};

type KeysStoreActionsType = {
  addKey: (key: KeyRecord) => void;
  removeKey: (i: number) => void;
};

export const useKeysStore = create<KeysStorageType & KeysStoreActionsType>()(
  persist(
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
      },
      removeKey: (i: number) => {
        const keys = get().keys.filter((_, index) => index !== i);
        const keyIndex = get().keyIndex > keys.length - 1 ? 0 : get().keyIndex;
        const currentKey = keys[keyIndex] ?? null;
        set({ keys, keyIndex, currentKey });
      },
    }),
    {
      name: "keys-storage", // unique name
      storage: createJSONStorage(() => asyncLocalStorage),
    }
  )
);
