import { BaseCommandType, CommandSource } from "./baseCommandType";

const commandMeta = {
  command: "forwardToInjectScript",
  uuid: "81941a7d-a0cf-4377-a420-446b729b6b4e",
};

export type ForwardToInjectScriptCommandType = BaseCommandType & {
  command: typeof commandMeta.command;
  uuid: typeof commandMeta.uuid;
  from: CommandSource;
  receivers: CommandSource[];
  forwardCommand: BaseCommandType;
  [key: string]: any;
};

export class ForwardToInjectScriptCommandFactory {
  static isCommand(payload: any): boolean {
    return (
      payload?.command === commandMeta.command &&
      payload?.uuid === commandMeta.uuid
    );
  }

  static tryFrom(payload: any): ForwardToInjectScriptCommandType | null {
    if (ForwardToInjectScriptCommandFactory.isCommand(payload)) {
      return payload as ForwardToInjectScriptCommandType;
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
  }): ForwardToInjectScriptCommandType {
    return { ...commandMeta, from, receivers, forwardCommand };
  }
}
