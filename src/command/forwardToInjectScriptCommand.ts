import { BaseCommand, CommandSource } from "./baseCommand";

const commandMeta = {
  command: "forwardToInjectScript",
  uuid: "81941a7d-a0cf-4377-a420-446b729b6b4e",
};

export type ForwardToInjectScriptCommand = BaseCommand & {
  command: typeof commandMeta.command;
  uuid: typeof commandMeta.uuid;
  from: CommandSource;
  receivers: CommandSource[];
  forwardCommand: BaseCommand;
  [key: string]: any;
};

export class ForwardToInjectScriptCommandFactory {
  static isCommand(payload: any): boolean {
    return (
      payload?.command === commandMeta.command &&
      payload?.uuid === commandMeta.uuid
    );
  }

  static tryFrom(payload: any): ForwardToInjectScriptCommand | null {
    if (ForwardToInjectScriptCommandFactory.isCommand(payload)) {
      return payload as ForwardToInjectScriptCommand;
    }
    return null;
  }

  static buildNew(
    from: CommandSource,
    receivers: CommandSource[],
    forwardCommand: BaseCommand
  ): ForwardToInjectScriptCommand {
    return { ...commandMeta, from, receivers, forwardCommand };
  }
}
