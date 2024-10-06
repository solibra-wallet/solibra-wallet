import { BaseCommandType, CommandSource } from "../base/baseCommandType";
import {
  OperationRequestCommandTemplate,
  OperationRequestCommandType,
} from "../base/operationRequestCommandType";

const commandMeta = {
  command: "connectRequest",
  uuid: "de2f7373-3996-496e-82bf-804aacc28d51",
};

export type ConnectRequestCommandType = BaseCommandType &
  OperationRequestCommandType & {
    command: typeof commandMeta.command;
    uuid: typeof commandMeta.uuid;
    from: CommandSource;
    requestPayload: object;
  };

export class ConnectRequestCommandFactory {
  static isCommand(payload: Record<string, any>): boolean {
    return (
      payload?.command === commandMeta.command &&
      payload?.uuid === commandMeta.uuid
    );
  }

  static tryFrom(
    payload: Record<string, any>
  ): ConnectRequestCommandType | null {
    if (ConnectRequestCommandFactory.isCommand(payload)) {
      return payload as ConnectRequestCommandType;
    }
    return null;
  }

  static buildNew({
    from,
    requestId,
    requestPublicKey,
    site,
  }: {
    from: CommandSource;
    requestId: string;
    requestPublicKey: string;
    site: string;
  }): ConnectRequestCommandType {
    return {
      ...commandMeta,
      ...OperationRequestCommandTemplate.buildNew({
        operation: "connect",
        requestId,
        requestPublicKey,
        site,
      }),
      from,
      requestPayload: {},
    };
  }
}
