import { useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore, StateCreator } from "zustand/vanilla";
import {
  asyncLocalStorage,
  STORE_SCOPE,
  syncStoreAcrossRuntime,
} from "./asyncLocalStorage";
import { encryptMessage } from "../common/asymEncryptionUtils";
import { strToBytes } from "../common/encodingUtils";

export enum OperationStateType {
  IDLE = "IDLE",
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
}

export type OperationRecord = {
  operation: string;
  requestPayload: Record<string, any>;
  requestId: string;
  requestPublicKey: string;
  site: string;
  state: OperationStateType;
  encryptedResultPayload: string | null;
  startTime: number;
  expireTime: number;
};

export function buildDefaultOperationRecord({
  operation,
  requestPayload,
  requestId,
  requestPublicKey,
  site,
}: {
  operation: string;
  requestPayload: Record<string, any>;
  requestId: string;
  requestPublicKey: string;
  site: string;
}): OperationRecord {
  return {
    operation,
    requestPayload,
    requestId,
    requestPublicKey,
    site,
    state: OperationStateType.PENDING,
    encryptedResultPayload: null,
    startTime: Date.now(),
    expireTime: Date.now() + 1000 * 60 * 3,
  };
}

export async function encryptOperationResultPayload(
  resultPayload: Record<string, any>,
  encryptKey: CryptoKey
): Promise<string> {
  return await encryptMessage(
    encryptKey,
    strToBytes(JSON.stringify(resultPayload))
  );
}

export type OperationStoreType = {
  operationRecords: Record<string, OperationRecord>;
  appendOperationRecord: (record: OperationRecord, tick: number) => void;
  getOperationRecord: (
    requestId: string,
    tick: number
  ) => OperationRecord | null;
  removeOperationRecord: (requestId: string, tick: number) => void;
  setOperationResult: (
    requestId: string,
    state: OperationStateType,
    encryptedResultPayload: string | null,
    tick: number
  ) => void;
  _removeExpiredOperationRecords: (tick: number) => boolean;
  clear: () => void;
};

// export type OperationStoreType = {
//   operation: string | null;
//   state: OperationStateType;
//   requestPayload: Record<string, any>;
//   requestId: string | null;
//   requestPublicKey: string | null;
//   site: string;
//   resultPayload: Record<string, any>;
//   setOperation: (params: {
//     operation: string;
//     requestPayload: Record<string, any>;
//     requestId: string;
//     requestPublicKey: string;
//     site: string;
//   }) => void;
//   setResult: (params: {
//     requestId: string;
//     state: OperationStateType;
//     resultPayload: Record<string, any>;
//   }) => void;
//   clear: () => void;
// };

const baseOperationStore: StateCreator<
  OperationStoreType,
  [],
  [["zustand/persist", unknown]]
> = persist(
  (set, get) => ({
    operationRecords: {},
    appendOperationRecord: (record: OperationRecord, tick: number): void => {
      const removedExpiredRecords = get()._removeExpiredOperationRecords(tick);
      const { operationRecords } = get();

      if (operationRecords[record.requestId]) {
        if (removedExpiredRecords) {
          syncStoreAcrossRuntime([STORE_SCOPE.OPERATION]);
        }
      } else {
        operationRecords[record.requestId] = record;

        set({
          operationRecords,
        });
        syncStoreAcrossRuntime([STORE_SCOPE.OPERATION]);
      }
    },
    getOperationRecord: (
      requestId: string,
      tick: number
    ): OperationRecord | null => {
      const removedExpiredRecords = get()._removeExpiredOperationRecords(tick);
      const { operationRecords } = get();
      if (!operationRecords[requestId]) {
        return null;
      }

      if (removedExpiredRecords) {
        syncStoreAcrossRuntime([STORE_SCOPE.OPERATION]);
      }

      return operationRecords[requestId];
    },
    removeOperationRecord: (requestId: string, tick: number): void => {
      const removedExpiredRecords = get()._removeExpiredOperationRecords(tick);
      const { operationRecords } = get();
      if (operationRecords[requestId]) {
        delete operationRecords[requestId];
        syncStoreAcrossRuntime([STORE_SCOPE.OPERATION]);
      } else if (removedExpiredRecords) {
        syncStoreAcrossRuntime([STORE_SCOPE.OPERATION]);
      }
    },
    setOperationResult: (
      requestId: string,
      state: OperationStateType,
      encryptedResultPayload: string | null,
      tick: number
    ): void => {
      const removedExpiredRecords = get()._removeExpiredOperationRecords(tick);
      const { operationRecords } = get();
      if (operationRecords[requestId]) {
        operationRecords[requestId] = {
          ...operationRecords[requestId],
          state,
          encryptedResultPayload,
        };

        set({
          operationRecords,
        });
        syncStoreAcrossRuntime([STORE_SCOPE.OPERATION]);
      } else if (removedExpiredRecords) {
        syncStoreAcrossRuntime([STORE_SCOPE.OPERATION]);
      }
    },
    _removeExpiredOperationRecords: (tick: number): boolean => {
      const { operationRecords } = get();
      const removeRequestIds: string[] = [];
      for (const key in operationRecords) {
        if (
          operationRecords[key].expireTime &&
          operationRecords[key].expireTime <= tick
        ) {
          removeRequestIds.push(key);
        }
      }

      if (removeRequestIds.length > 0) {
        for (const requestId of removeRequestIds) {
          delete operationRecords[requestId];
        }

        set({
          operationRecords,
        });

        return true;
      }
      return false;
    },
    clear: (): void => {
      if (Object.keys(get().operationRecords).length > 0) {
        set({
          operationRecords: {},
        });

        syncStoreAcrossRuntime([STORE_SCOPE.OPERATION]);
      }
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
