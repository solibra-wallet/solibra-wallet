import { BaseCommandType, CommandSource } from "./baseCommand";

const commandMeta = {
  command: "forwardToBackground",
  uuid: "5847d480-a1fc-4e63-9240-6077df8b73c6",
};

export type ForwardToBackgroundCommandType = BaseCommandType & {
  command: typeof commandMeta.command;
  uuid: typeof commandMeta.uuid;
  from: CommandSource;
  receivers: CommandSource[];
  forwardCommand: BaseCommandType;
  [key: string]: any;
};

export class ForwardToBackgroundCommandTypeFactory {
  static isCommand(payload: any): boolean {
    return (
      payload?.command === commandMeta.command &&
      payload?.uuid === commandMeta.uuid
    );
  }

  static tryFrom(payload: any): ForwardToBackgroundCommandType | null {
    if (ForwardToBackgroundCommandTypeFactory.isCommand(payload)) {
      return payload as ForwardToBackgroundCommandType;
    }
    return null;
  }

  static buildNew({
    from,
    receivers,
    forwardCommand,
  }: {
    from: CommandSource;
    receivers: CommandSource[];
    forwardCommand: BaseCommandType;
  }): ForwardToBackgroundCommandType {
    return { ...commandMeta, from, receivers, forwardCommand };
  }
}
