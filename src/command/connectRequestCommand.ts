import { BaseCommandType, CommandSource } from "./baseCommandType";
import { OperationRequestCommandType } from "./operationRequestCommandType";

const commandMeta = {
  command: "connectRequest",
  uuid: "de2f7373-3996-496e-82bf-804aacc28d51",
};

export type ConnectRequestCommandType = BaseCommandType &
  OperationRequestCommandType & {
    command: typeof commandMeta.command;
    uuid: typeof commandMeta.uuid;
    from: CommandSource;
    operationRequestPayload: {
      site: string;
      [key: string]: any;
    };
    [key: string]: any;
  };

export class ConnectRequestCommandFactory {
  static isCommand(payload: any): boolean {
    return (
      payload?.command === commandMeta.command &&
      payload?.uuid === commandMeta.uuid
    );
  }

  static tryFrom(payload: any): ConnectRequestCommandType | null {
    if (ConnectRequestCommandFactory.isCommand(payload)) {
      return payload as ConnectRequestCommandType;
    }
    return null;
  }

  static buildNew({
    from,
    operationRequestId,
    operationRequestPublicKey,
    site,
  }: {
    from: CommandSource;
    operationRequestId: string;
    operationRequestPublicKey: string;
    site: string;
  }): ConnectRequestCommandType {
    return {
      ...commandMeta,
      from,
      operation: "connect",
      operationRequestPayload: {
        site,
      },
      operationRequestId,
      operationRequestPublicKey,
    };
  }
}
