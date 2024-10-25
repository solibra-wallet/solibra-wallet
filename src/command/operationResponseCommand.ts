import { decryptMessage } from "../common/asymEncryptionUtils";
import { bytesToStr } from "../common/encodingUtils";
import { OperationStateType } from "../store/operationStore";
import { BaseCommandType, CommandSource } from "./base/baseCommandType";

const commandMeta = {
  command: "operationResponse",
  uuid: "228b3451-5c9c-4d82-aece-fbbd64490edc",
};

export type OperationResponseCommandType = BaseCommandType & {
  command: typeof commandMeta.command;
  uuid: typeof commandMeta.uuid;
  from: CommandSource;
  requestId: string;
  state: OperationStateType;
  encryptedResultPayload: string | null;
};

export class OperationResponseCommandFactory {
  static isCommand(payload: any): boolean {
    return (
      payload?.command === commandMeta.command &&
      payload?.uuid === commandMeta.uuid
    );
  }

  static tryFrom(payload: any): OperationResponseCommandType | null {
    if (OperationResponseCommandFactory.isCommand(payload)) {
      return payload as OperationResponseCommandType;
    }
    return null;
  }

  static async buildNew({
    from,
    requestId,
    state,
    encryptedResultPayload,
  }: {
    from: CommandSource;
    requestId: string;
    state: OperationStateType;
    encryptedResultPayload: string;
  }): Promise<OperationResponseCommandType> {
    return { ...commandMeta, from, requestId, state, encryptedResultPayload };
  }

  static buildNewWithoutResultPayload({
    from,
    requestId,
    state,
  }: {
    from: CommandSource;
    requestId: string;
    state: OperationStateType;
  }): OperationResponseCommandType {
    return {
      ...commandMeta,
      from,
      requestId,
      state,
      encryptedResultPayload: null,
    };
  }

  static async defaultDecrypt(
    encryptedResultPayload: string,
    decryptKey: CryptoKey
  ): Promise<Record<string, any>> {
    return JSON.parse(
      bytesToStr(await decryptMessage(decryptKey, encryptedResultPayload))
    );
  }
}
