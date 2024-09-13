import { useKeysStore } from "../../store/keysStore.ts";
import {
  OperationStateType,
  useOperationStore,
} from "../../store/operationStore.ts";
import { sendMsgToContentScript } from "../utils/messageUtils.ts";
import { importPublicKey } from "../../common/asymEncryptionUtils.ts";
import { ForwardToInjectScriptCommandFactory } from "../../command/transport/forwardToInjectScriptCommand.ts";
import { OperationResponseCommandFactory } from "../../command/operationResponseCommand.ts";
import { CommandSource } from "../../command/base/baseCommandType.ts";

function ConnectPage() {
  const operation = useOperationStore((state) => state.operation);
  const operationPayload = useOperationStore((state) => state.requestPayload);
  const operationRequestId = useOperationStore((state) => state.requestId);
  const operationRequestPublicKey = useOperationStore(
    (state) => state.requestPublicKey
  );
  const clearOperation = useOperationStore((state) => state.clear);
  const currentKey = useKeysStore((state) => state.currentKey);

  // const signPayload =
  //   operationPayload &&
  //   operationPayload["signPayload"] &&
  //   hexToBytes(operationPayload["signPayload"]);
  // const decodedPayload = signPayload && new TextDecoder().decode(signPayload);

  const rejectHandle = async () => {
    if (!operationRequestId) {
      throw new Error("operationRequestId is not set");
    }
    if (!operationRequestPublicKey) {
      throw new Error("operationRequestPublicKey is not set");
    }

    const operationRequestPublicKeyInstance = await importPublicKey(
      operationRequestPublicKey
    );

    clearOperation();

    await sendMsgToContentScript(
      ForwardToInjectScriptCommandFactory.buildNew({
        from: CommandSource.POPUP_SCRIPT,
        receivers: [CommandSource.INJECT_SCRIPT],
        forwardCommand: await OperationResponseCommandFactory.buildNew({
          from: CommandSource.POPUP_SCRIPT,
          requestId: operationRequestId,
          state: OperationStateType.ERROR,
          resultPayload: { reason: "User rejected." },
          encryptKey: operationRequestPublicKeyInstance,
        }),
      })
    );

    window.close();
  };

  const connectHandle = async () => {
    if (!currentKey) {
      return;
    }

    if (!operationRequestId) {
      throw new Error("operationRequestId is not set");
    }
    if (!operationRequestPublicKey) {
      throw new Error("operationRequestPublicKey is not set");
    }

    const operationRequestPublicKeyInstance = await importPublicKey(
      operationRequestPublicKey
    );

    clearOperation();

    await sendMsgToContentScript(
      ForwardToInjectScriptCommandFactory.buildNew({
        from: CommandSource.POPUP_SCRIPT,
        receivers: [CommandSource.INJECT_SCRIPT],
        forwardCommand: await OperationResponseCommandFactory.buildNew({
          from: CommandSource.POPUP_SCRIPT,
          requestId: operationRequestId,
          state: OperationStateType.COMPLETED,
          resultPayload: { publicKey: currentKey.publicKey },
          encryptKey: operationRequestPublicKeyInstance,
        }),
      })
    );

    window.close();
  };

  return (
    <div style={{ width: 400, wordWrap: "break-word" }}>
      <div>Current wallet: {currentKey?.name}</div>
      <div>------------</div>
      <h1>Connect to site</h1>
      <div className="card">
        <div>Site: {operationPayload.site}</div>
        <div>------------</div>
        <button onClick={rejectHandle}>Reject</button>
        <button onClick={connectHandle}>Connect</button>
      </div>
      <hr />
    </div>
  );
}

export default ConnectPage;
