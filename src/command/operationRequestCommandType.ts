import { BaseCommandType } from "./baseCommandType";

export type OperationRequestCommandType = BaseCommandType & {
  operation: string;
  operationRequestPayload: Record<string, any>;
  operationRequestId: string;
  operationRequestPublicKey: string;
  [key: string]: any;
};
