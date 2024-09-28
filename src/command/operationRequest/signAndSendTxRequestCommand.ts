import { SendOptions } from "@solana/web3.js";
import { BaseCommandType, CommandSource } from "../base/baseCommandType";
import {
  OperationRequestCommandTemplate,
  OperationRequestCommandType,
} from "../base/operationRequestCommandType";

const commandMeta = {
  command: "SignAndSendTxRequest",
  uuid: "f537b80b-fa9c-4b4b-88f8-723ccd479ca9",
};

export type SignAndSendTxRequestCommandType = BaseCommandType &
  OperationRequestCommandType & {
    command: typeof commandMeta.command;
    uuid: typeof commandMeta.uuid;
    from: CommandSource;
    requestPayload: {
      encodedTransaction: string;
      sendOptions?: SendOptions;
    };
  };

export class SignAndSendTxRequestCommandFactory {
  static isCommand(payload: any): boolean {
    return (
      payload?.command === commandMeta.command &&
      payload?.uuid === commandMeta.uuid
    );
  }

  static tryFrom(payload: any): SignAndSendTxRequestCommandType | null {
    if (SignAndSendTxRequestCommandFactory.isCommand(payload)) {
      return payload as SignAndSendTxRequestCommandType;
    }
    return null;
  }

  static buildNew({
    from,
    encodedTransaction,
    sendOptions,
    requestId,
    requestPublicKey,
  }: {
    from: CommandSource;
    encodedTransaction: string;
    sendOptions?: SendOptions;
    requestId: string;
    requestPublicKey: string;
  }): SignAndSendTxRequestCommandType {
    return {
      ...commandMeta,
      ...OperationRequestCommandTemplate.buildNew({
        operation: "signAndSendTx",
        requestId: requestId,
        requestPublicKey: requestPublicKey,
      }),
      from,
      requestPayload: { encodedTransaction, sendOptions },
    };
  }
}
