import { BaseCommandType, CommandSource } from "./baseCommand";

const commandMeta = {
  command: "connectResponse",
  uuid: "a5251654-29ec-48e5-8675-d649ab71a817",
};

export type ConnectResponseCommandType = BaseCommandType & {
  command: typeof commandMeta.command;
  uuid: typeof commandMeta.uuid;
  from: CommandSource;
  publicKey: string;
  [key: string]: any;
};

export class ConnectResponseCommandFactory {
  static isCommand(payload: any): boolean {
    return (
      payload?.command === commandMeta.command &&
      payload?.uuid === commandMeta.uuid
    );
  }

  static tryFrom(payload: any): ConnectResponseCommandType | null {
    if (ConnectResponseCommandFactory.isCommand(payload)) {
      return payload as ConnectResponseCommandType;
    }
    return null;
  }

  static buildNew({
    from,
    publicKey,
  }: {
    from: CommandSource;
    publicKey: string;
  }): ConnectResponseCommandType {
    return { ...commandMeta, from, publicKey };
  }
}
