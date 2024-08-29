import { BaseCommand, CommandSource } from "./baseCommand";

const commandMeta = {
  command: "refreshKeysStore",
  uuid: "0219508e-8ca3-42fa-9d78-1e1dac076035",
};

export type RefreshKeysStoreCommand = BaseCommand & {
  command: typeof commandMeta.command;
  uuid: typeof commandMeta.uuid;
  from: CommandSource;
  [key: string]: any;
};

export class RefreshKeysStoreCommandFactory {
  static isCommand(payload: any): boolean {
    return (
      payload?.command === commandMeta.command &&
      payload?.uuid === commandMeta.uuid
    );
  }

  static tryFrom(payload: any): RefreshKeysStoreCommand | null {
    if (RefreshKeysStoreCommandFactory.isCommand(payload)) {
      return payload as RefreshKeysStoreCommand;
    }
    return null;
  }

  static buildNew(from: CommandSource): RefreshKeysStoreCommand {
    return { ...commandMeta, from };
  }
}
