export type OperationRequestCommandType = {
  operation: string;
  requestPayload: Record<string, any>;
  requestId: string;
  requestPublicKey: string;
  site: string;
};

export class OperationRequestCommandTemplate {
  static tryFrom(payload: any): OperationRequestCommandType | null {
    if (
      payload?.operation &&
      payload?.requestPayload &&
      payload?.requestId &&
      payload?.requestPublicKey &&
      payload?.site
    ) {
      return {
        operation: payload.operation,
        requestPayload: payload.requestPayload,
        requestId: payload.requestId,
        requestPublicKey: payload.requestPublicKey,
        site: payload.site,
      };
    }
    return null;
  }

  static buildNew({
    operation,
    requestPayload,
    requestId,
    requestPublicKey,
    site,
  }: {
    operation: string;
    requestPayload?: Record<string, any>;
    requestId: string;
    requestPublicKey: string;
    site: string;
  }): OperationRequestCommandType {
    return {
      operation,
      requestPayload: requestPayload ?? {},
      requestId,
      requestPublicKey,
      site,
    };
  }
}
