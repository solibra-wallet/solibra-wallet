import { BaseCommandType, CommandSource } from "../base/baseCommandType";

const commandMeta = {
  command: "refreshOperationStore",
  uuid: "72ec47af-083f-4026-82fe-f2af529399c4",
};

export type RefreshOperationStoreCommandType = BaseCommandType & {
  command: typeof commandMeta.command;
  uuid: typeof commandMeta.uuid;
  from: CommandSource;
};

export class RefreshOperationStoreCommandFactory {
  static isCommand(payload: any): boolean {
    return (
      payload?.command === commandMeta.command &&
      payload?.uuid === commandMeta.uuid
    );
  }

  static tryFrom(payload: any): RefreshOperationStoreCommandType | null {
    if (RefreshOperationStoreCommandFactory.isCommand(payload)) {
      return payload as RefreshOperationStoreCommandType;
    }
    return null;
  }

  static buildNew({
    from,
  }: {
    from: CommandSource;
  }): RefreshOperationStoreCommandType {
    return { ...commandMeta, from };
  }
}
