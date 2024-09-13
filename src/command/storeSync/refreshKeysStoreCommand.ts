import { BaseCommandType, CommandSource } from "../base/baseCommandType";

const commandMeta = {
  command: "refreshKeysStore",
  uuid: "0219508e-8ca3-42fa-9d78-1e1dac076035",
};

export type RefreshKeysStoreCommandType = BaseCommandType & {
  command: typeof commandMeta.command;
  uuid: typeof commandMeta.uuid;
  from: CommandSource;
};

export class RefreshKeysStoreCommandFactory {
  static isCommand(payload: any): boolean {
    return (
      payload?.command === commandMeta.command &&
      payload?.uuid === commandMeta.uuid
    );
  }

  static tryFrom(payload: any): RefreshKeysStoreCommandType | null {
    if (RefreshKeysStoreCommandFactory.isCommand(payload)) {
      return payload as RefreshKeysStoreCommandType;
    }
    return null;
  }

  static buildNew({
    from,
  }: {
    from: CommandSource;
  }): RefreshKeysStoreCommandType {
    return { ...commandMeta, from };
  }
}
