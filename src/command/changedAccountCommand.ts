import { BaseCommandType, CommandSource } from "./baseCommandType";

const commandMeta = {
  command: "changedAccount",
  uuid: "4f3ecff0-587e-4320-9a12-a1dc028168cc",
};

export type ChangedAccountCommandType = BaseCommandType & {
  command: typeof commandMeta.command;
  uuid: typeof commandMeta.uuid;
  from: CommandSource;
  publicKey: string | null;
  [key: string]: any;
};

export class ChangedAccountCommandFactory {
  static isCommand(payload: any): boolean {
    return (
      payload?.command === commandMeta.command &&
      payload?.uuid === commandMeta.uuid
    );
  }

  static tryFrom(payload: any): ChangedAccountCommandType | null {
    if (ChangedAccountCommandFactory.isCommand(payload)) {
      return payload as ChangedAccountCommandType;
    }
    return null;
  }

  static buildNew({
    from,
    publicKey,
  }: {
    from: CommandSource;
    publicKey: string | null;
  }): ChangedAccountCommandType {
    return { ...commandMeta, from, publicKey };
  }
}
