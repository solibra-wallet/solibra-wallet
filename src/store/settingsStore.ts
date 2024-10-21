import { useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore, StateCreator } from "zustand/vanilla";
import {
  asyncLocalStorage,
  STORE_SCOPE,
  syncStoreAcrossRuntime,
} from "./asyncLocalStorage";
import { ClusterRecordType, ClusterRpcConfigRecordType } from "./cluster/types";

const enum BASE_NETWORKS {
  MAINNET = "mainnet",
  DEVNET = "devnet",
}

export type SettingsStoreType = {
  devicePrivateKey: string;
  devicePublicKey: string;
  clusters: ClusterRecordType[];
  clusterRpcs: Record<string, ClusterRpcConfigRecordType[]>;
  currentCluster: string;
  currentClusterRpc: string | null;
  isDeviceKeysInitialized: () => boolean;
  setDeviceKeys: (privateKey: string, publicKey: string) => void;
  addCluster: (cluster: string) => void;
  removeCluster: (cluster: string) => void;
  switchCluster: (cluster: string) => void;
  addClusterRpc: (cluster: string, rpc: ClusterRpcConfigRecordType) => void;
  removeClusterRpc: (cluster: string, id: string) => void;
  selectClusterRpc: (cluster: string, id: string) => void;
};

const baseSettingsStore: StateCreator<
  SettingsStoreType,
  [],
  [["zustand/persist", unknown]]
> = persist(
  (set, get) => ({
    devicePrivateKey: "",
    devicePublicKey: "",
    clusters: [
      { name: BASE_NETWORKS.MAINNET, protected: true },
      { name: BASE_NETWORKS.DEVNET, protected: true },
    ],
    clusterRpcs: {
      [BASE_NETWORKS.MAINNET]: [
        {
          id: "default",
          name: "Default",
          active: true,
          protected: true,
          rpcUrl: "",
        },
      ],
      [BASE_NETWORKS.DEVNET]: [
        {
          id: "default",
          name: "Default",
          active: true,
          protected: true,
          rpcUrl: "",
        },
      ],
    },
    currentCluster: BASE_NETWORKS.MAINNET,
    currentClusterRpc: null,
    isDeviceKeysInitialized: () => {
      return get().devicePrivateKey !== "" && get().devicePublicKey !== "";
    },
    setDeviceKeys: (privateKey: string, publicKey: string) => {
      set({ devicePrivateKey: privateKey, devicePublicKey: publicKey });

      syncStoreAcrossRuntime([STORE_SCOPE.SETTINGS]);
    },
    addCluster: (cluster: string) => {
      const clusters = [...get().clusters];
      if (clusters.find((c) => c.name === cluster)) {
        throw new Error("Cluster already exists!");
      }
      clusters.push({ name: cluster, protected: false });

      const clusterRpcs = { ...get().clusterRpcs };
      clusterRpcs[cluster] = clusterRpcs[cluster] ?? [];
      set({ clusters, clusterRpcs });

      syncStoreAcrossRuntime([STORE_SCOPE.SETTINGS]);
    },
    removeCluster: (cluster: string) => {
      let clusters = [...get().clusters];
      if (clusters.find((c) => c.name === cluster)?.protected) {
        throw new Error("Cannot remove protected cluster!");
      }

      const clusterRpcs = { ...get().clusterRpcs };
      if (
        cluster === BASE_NETWORKS.MAINNET ||
        cluster === BASE_NETWORKS.MAINNET
      ) {
        throw new Error("Cannot remove mainnet or devnet!");
      }

      clusters = clusters.filter((c) => c.name !== cluster);
      delete clusterRpcs[cluster];

      let currentCluster = get().currentCluster;
      let currentClusterRpc = get().currentClusterRpc;
      if (cluster === currentCluster) {
        currentCluster = BASE_NETWORKS.MAINNET;
        currentClusterRpc =
          get().clusterRpcs[BASE_NETWORKS.MAINNET].find((c) => c.active)
            ?.rpcUrl ?? null;
      }
      set({ currentCluster, clusters, clusterRpcs, currentClusterRpc });

      syncStoreAcrossRuntime([STORE_SCOPE.SETTINGS]);
    },
    switchCluster: (cluster: string) => {
      if (get().currentCluster === cluster) {
        return;
      }

      if (get().clusters.find((c) => c.name === cluster) === undefined) {
        throw new Error("Cluster does not exist!");
      }

      const currentClusterRpc =
        get().clusterRpcs[cluster].find((c) => c.active)?.rpcUrl ?? null;
      set({ currentCluster: cluster, currentClusterRpc });

      syncStoreAcrossRuntime([STORE_SCOPE.SETTINGS]);
    },
    addClusterRpc: (cluster: string, rpc: ClusterRpcConfigRecordType) => {
      const clusterRpcs = { ...get().clusterRpcs };
      if (clusterRpcs[cluster] === undefined) {
        throw new Error("Cluster does not exist!");
      }
      if (clusterRpcs[cluster].find((r) => r.id === rpc.id)) {
        throw new Error("Cluster RPC record already exists!");
      }
      clusterRpcs[cluster].push(rpc);
      set({ clusterRpcs });

      syncStoreAcrossRuntime([STORE_SCOPE.SETTINGS]);
    },
    removeClusterRpc: (cluster: string, id: string) => {
      const clusterRpcs = { ...get().clusterRpcs };
      if (clusterRpcs[cluster] === undefined) {
        throw new Error("Cluster does not exist!");
      }
      clusterRpcs[cluster] = clusterRpcs[cluster].filter((r) => r.id !== id);
      if (
        !clusterRpcs[cluster].find((r) => r.active) &&
        clusterRpcs[cluster].length > 0
      ) {
        clusterRpcs[cluster][0].active = true;
      }
      set({ clusterRpcs });

      syncStoreAcrossRuntime([STORE_SCOPE.SETTINGS]);
    },
    selectClusterRpc: (cluster: string, id: string) => {
      const clusterRpcs = { ...get().clusterRpcs };
      if (clusterRpcs[cluster] === undefined) {
        throw new Error("Cluster does not exist!");
      }
      if (!clusterRpcs[cluster].find((r) => r.id === id)) {
        throw new Error("Cluster RPC record does not exist!");
      }
      clusterRpcs[cluster] = clusterRpcs[cluster].map((r) => ({
        ...r,
        active: r.id === id,
      }));
      const currentClusterRpc =
        clusterRpcs[cluster].find((r) => r.active)?.rpcUrl ?? null;
      set({ clusterRpcs, currentClusterRpc });

      syncStoreAcrossRuntime([STORE_SCOPE.SETTINGS]);
    },
  }),
  {
    name: "settings-storage", // unique name
    storage: createJSONStorage(() => asyncLocalStorage),
  }
);

export const settingsStore =
  createStore<SettingsStoreType>()(baseSettingsStore);

export function useSettingsStore(): SettingsStoreType;
export function useSettingsStore<T>(
  selector: (state: SettingsStoreType) => T
): T;
export function useSettingsStore<T>(
  selector?: (state: SettingsStoreType) => T
) {
  return useStore(settingsStore, selector!);
}
