export const enum CommandSource {
  BACKGROUND = "BACKGROUND",
  CONTENT_SCRIPT = "CONTENT_SCRIPT",
  POPUP_SCRIPT = "POPUP_SCRIPT",
  INJECT_SCRIPT = "INJECT_SCRIPT",
  // UNKNOWN = "UNKNOWN",
}

export type BaseCommandType = {
  command: string;
  uuid: string;
  from: CommandSource;
};
