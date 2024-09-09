import { OperationStateType } from "../store/operationStore";
import { BaseCommandType, CommandSource } from "./baseCommandType";

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
  resultPayload: Record<string, any>;
  [key: string]: any;
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

  static buildNew({
    from,
    requestId,
    state,
    resultPayload,
  }: {
    from: CommandSource;
    requestId: string;
    state: OperationStateType;
    resultPayload: Record<string, any>;
  }): OperationResponseCommandType {
    return { ...commandMeta, from, requestId, state, resultPayload };
  }
}
