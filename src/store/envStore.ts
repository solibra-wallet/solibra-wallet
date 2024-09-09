import { createStore } from "zustand/vanilla";

export type EnvStoreType = {
  env: string;
  setEnv: (env: string) => void;
};

export const envStore = createStore<EnvStoreType>()(
  (set: any, get: any, store: any) => ({
    env: "default",
    setEnv: (env: string) => set({ env }),
  })
);
