import { useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore, StateCreator } from "zustand/vanilla";
import { asyncLocalStorage, syncStoreAcrossRuntime } from "./asyncLocalStorage";

export enum OperationStateType {
  IDLE = "IDLE",
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
}

export type OperationStoreType = {
  operation: string | null;
  requestPayload: Record<string, any>;
  requestId: string | null;
  requestPublicKey: string | null;
  state: OperationStateType;
  resultPayload: Record<string, any>;
  setOperation: (params: {
    operation: string;
    requestPayload: Record<string, any>;
    requestId: string;
    requestPublicKey: string;
  }) => void;
  setResult: (params: {
    requestId: string;
    state: OperationStateType;
    resultPayload: Record<string, any>;
  }) => void;
  reset: () => void;
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
    resultPayload: {},
    setOperation: (params: {
      operation: string;
      requestPayload: Record<string, any>;
      requestId: string;
      requestPublicKey: string;
    }) => {
      const { operation, requestPayload, requestId, requestPublicKey } = params;
      set({
        operation,
        requestPayload,
        requestId,
        requestPublicKey,
        state: OperationStateType.PENDING,
        resultPayload: {},
      });

      syncStoreAcrossRuntime();
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

      syncStoreAcrossRuntime();
    },
    reset: () => {
      set({
        operation: null,
        requestPayload: {},
        requestId: null,
        requestPublicKey: null,
        state: OperationStateType.IDLE,
        resultPayload: {},
      });

      syncStoreAcrossRuntime();
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
