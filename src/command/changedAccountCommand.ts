import { BaseCommand, CommandSource } from "./baseCommand";

const commandMeta = {
  command: "changedAccount",
  uuid: "4f3ecff0-587e-4320-9a12-a1dc028168cc",
};

export type ChangedAccountCommand = BaseCommand & {
  command: typeof commandMeta.command;
  uuid: typeof commandMeta.uuid;
  from: CommandSource;
  [key: string]: any;
};

export class ChangedAccountCommandFactory {
  static isCommand(payload: any): boolean {
    return (
      payload?.command === commandMeta.command &&
      payload?.uuid === commandMeta.uuid
    );
  }

  static tryFrom(payload: any): ChangedAccountCommand | null {
    if (ChangedAccountCommandFactory.isCommand(payload)) {
      return payload as ChangedAccountCommand;
    }
    return null;
  }

  static buildNew(from: CommandSource): ChangedAccountCommand {
    return { ...commandMeta, from };
  }
}
