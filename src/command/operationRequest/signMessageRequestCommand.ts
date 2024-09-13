import { BaseCommandType, CommandSource } from "../base/baseCommandType";
import {
  OperationRequestCommandTemplate,
  OperationRequestCommandType,
} from "../base/operationRequestCommandType";

const commandMeta = {
  command: "SignMessageRequest",
  uuid: "07559fed-41e8-4bbe-b32d-5d11ef6c6389",
};

export type SignMessageRequestCommandType = BaseCommandType &
  OperationRequestCommandType & {
    command: typeof commandMeta.command;
    uuid: typeof commandMeta.uuid;
    from: CommandSource;
    requestPayload: {
      signPayload: string;
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
    requestId,
    requestPublicKey,
  }: {
    from: CommandSource;
    signPayload: string;
    requestId: string;
    requestPublicKey: string;
  }): SignMessageRequestCommandType {
    return {
      ...commandMeta,
      ...OperationRequestCommandTemplate.buildNew({
        operation: "signMessage",
        requestId: requestId,
        requestPublicKey: requestPublicKey,
      }),
      from,
      requestPayload: { signPayload },
    };
  }
}
