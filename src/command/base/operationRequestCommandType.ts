export type OperationRequestCommandType = {
  operation: string;
  requestPayload: Record<string, any>;
  requestId: string;
  requestPublicKey: string;
};

export class OperationRequestCommandTemplate {
  static tryFrom(payload: any): OperationRequestCommandType | null {
    if (
      payload?.operation &&
      payload?.requestPayload &&
      payload?.requestId &&
      payload?.requestPublicKey
    ) {
      return {
        operation: payload.operation,
        requestPayload: payload.requestPayload,
        requestId: payload.requestId,
        requestPublicKey: payload.requestPublicKey,
      };
    }
    return null;
  }

  static buildNew({
    operation,
    requestPayload,
    requestId,
    requestPublicKey,
  }: {
    operation: string;
    requestPayload?: Record<string, any>;
    requestId: string;
    requestPublicKey: string;
  }): OperationRequestCommandType {
    return {
      operation,
      requestPayload: requestPayload ?? {},
      requestId,
      requestPublicKey,
    };
  }
}
