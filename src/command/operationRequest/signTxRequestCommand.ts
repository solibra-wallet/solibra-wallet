import { BaseCommandType, CommandSource } from "../base/baseCommandType";
import {
  OperationRequestCommandTemplate,
  OperationRequestCommandType,
} from "../base/operationRequestCommandType";

const commandMeta = {
  command: "SignTxRequest",
  uuid: "1d510e91-c0d6-446a-9112-cc241f6b76ea",
};

export type SignTxRequestCommandType = BaseCommandType &
  OperationRequestCommandType & {
    command: typeof commandMeta.command;
    uuid: typeof commandMeta.uuid;
    from: CommandSource;
    requestPayload: {
      encodedTransaction: string;
    };
  };

export class SignTxRequestCommandFactory {
  static isCommand(payload: any): boolean {
    return (
      payload?.command === commandMeta.command &&
      payload?.uuid === commandMeta.uuid
    );
  }

  static tryFrom(payload: any): SignTxRequestCommandType | null {
    if (SignTxRequestCommandFactory.isCommand(payload)) {
      return payload as SignTxRequestCommandType;
    }
    return null;
  }

  static buildNew({
    from,
    encodedTransaction,
    requestId,
    requestPublicKey,
    site,
  }: {
    from: CommandSource;
    encodedTransaction: string;
    requestId: string;
    requestPublicKey: string;
    site: string;
  }): SignTxRequestCommandType {
    return {
      ...commandMeta,
      ...OperationRequestCommandTemplate.buildNew({
        operation: "signTx",
        requestId: requestId,
        requestPublicKey: requestPublicKey,
        site,
      }),
      from,
      requestPayload: { encodedTransaction, site },
    };
  }
}
