import { createStore } from "zustand/vanilla";

export const envStore = createStore<{
  env: string;
  setEnv: (env: string) => void;
}>()((set, get) => ({
  env: "default",
  setEnv: (env: string) => set({ env }),
}));
