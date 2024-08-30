import { BaseCommandType, CommandSource } from "./baseCommand";

const commandMeta = {
  command: "connectRequest",
  uuid: "de2f7373-3996-496e-82bf-804aacc28d51",
};

export type ConnectRequestCommandType = BaseCommandType & {
  command: typeof commandMeta.command;
  uuid: typeof commandMeta.uuid;
  from: CommandSource;
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
  }: {
    from: CommandSource;
  }): ConnectRequestCommandType {
    return { ...commandMeta, from };
  }
}
