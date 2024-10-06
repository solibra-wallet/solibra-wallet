import { useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore, StateCreator } from "zustand/vanilla";
import {
  asyncLocalStorage,
  STORE_SCOPE,
  syncStoreAcrossRuntime,
} from "./asyncLocalStorage";

export enum OperationStateType {
  IDLE = "IDLE",
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
}

export type OperationStoreType = {
  operation: string | null;
  state: OperationStateType;
  requestPayload: Record<string, any>;
  requestId: string | null;
  requestPublicKey: string | null;
  site: string;
  resultPayload: Record<string, any>;
  setOperation: (params: {
    operation: string;
    requestPayload: Record<string, any>;
    requestId: string;
    requestPublicKey: string;
    site: string;
  }) => void;
  setResult: (params: {
    requestId: string;
    state: OperationStateType;
    resultPayload: Record<string, any>;
  }) => void;
  clear: () => void;
};

const baseOperationStore: StateCreator<
  OperationStoreType,
  [],
  [["zustand/persist", unknown]]
> = persist(
  (set, get) => ({
    operation: null,
    requestPayload: {},
    requestId: null,
    requestPublicKey: null,
    state: OperationStateType.IDLE,
    site: "Unknown",
    resultPayload: {},
    setOperation: (params: {
      operation: string;
      requestPayload: Record<string, any>;
      requestId: string;
      requestPublicKey: string;
      site: string;
    }) => {
      const { operation, requestPayload, requestId, requestPublicKey, site } =
        params;
      set({
        operation,
        requestPayload,
        requestId,
        requestPublicKey,
        site,
        state: OperationStateType.PENDING,
        resultPayload: {},
      });

      syncStoreAcrossRuntime([STORE_SCOPE.OPERATION]);
    },
    setResult: (params: {
      requestId: string;
      state: OperationStateType;
      resultPayload: Record<string, any>;
    }) => {
      const { state, resultPayload, requestId } = params;
      set({
        operation: null,
        requestPayload: {},
        requestId,
        requestPublicKey: null,
        state,
        resultPayload,
      });

      syncStoreAcrossRuntime([STORE_SCOPE.OPERATION]);
    },
    clear: () => {
      set({
        operation: null,
        requestPayload: {},
        requestId: null,
        requestPublicKey: null,
        site: "Unknown",
        state: OperationStateType.IDLE,
        resultPayload: {},
      });

      syncStoreAcrossRuntime([STORE_SCOPE.OPERATION]);
    },
  }),
  {
    name: "operation-storage", // unique name
    storage: createJSONStorage(() => asyncLocalStorage),
  }
);

export const operationStore =
  createStore<OperationStoreType>()(baseOperationStore);

export function useOperationStore(): OperationStoreType;
export function useOperationStore<T>(
  selector: (state: OperationStoreType) => T
): T;
export function useOperationStore<T>(
  selector?: (state: OperationStoreType) => T
) {
  return useStore(operationStore, selector!);
}
