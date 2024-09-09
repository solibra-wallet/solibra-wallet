import { BaseCommandType, CommandSource } from "./baseCommandType";
import { OperationRequestCommandType } from "./operationRequestCommandType";

const commandMeta = {
  command: "SignMessageRequest",
  uuid: "07559fed-41e8-4bbe-b32d-5d11ef6c6389",
};

export type SignMessageRequestCommandType = BaseCommandType &
  OperationRequestCommandType & {
    command: typeof commandMeta.command;
    uuid: typeof commandMeta.uuid;
    from: CommandSource;
    operationRequestPayload: {
      signPayload: string;
      [key: string]: any;
    };
  };

export class SignMessageRequestCommandFactory {
  static isCommand(payload: any): boolean {
    return (
      payload?.command === commandMeta.command &&
      payload?.uuid === commandMeta.uuid
    );
  }

  static tryFrom(payload: any): SignMessageRequestCommandType | null {
    if (SignMessageRequestCommandFactory.isCommand(payload)) {
      return payload as SignMessageRequestCommandType;
    }
    return null;
  }

  static buildNew({
    from,
    signPayload,
    operationRequestId,
    operationRequestPublicKey,
  }: {
    from: CommandSource;
    signPayload: string;
    operationRequestId: string;
    operationRequestPublicKey: string;
  }): SignMessageRequestCommandType {
    return {
      ...commandMeta,
      from,
      operation: "signMessage",
      operationRequestPayload: { signPayload },
      operationRequestId,
      operationRequestPublicKey,
    };
  }
}
