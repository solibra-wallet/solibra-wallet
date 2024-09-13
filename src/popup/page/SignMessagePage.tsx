import { useKeysStore } from "../../store/keysStore.ts";
import { restoreKeypair } from "../../store/keyRecord";
import {
  OperationStateType,
  useOperationStore,
} from "../../store/operationStore.ts";
import { sendMsgToContentScript } from "../utils/messageUtils.ts";
import { bytesToHex, hexToBytes } from "../../common/encodingUtils.ts";
import nacl from "tweetnacl";
import { importPublicKey } from "../../common/asymEncryptionUtils.ts";
import { ForwardToInjectScriptCommandFactory } from "../../command/transport/forwardToInjectScriptCommand.ts";
import { OperationResponseCommandFactory } from "../../command/operationResponseCommand.ts";
import { CommandSource } from "../../command/base/baseCommandType.ts";

function SignMessagePage() {
  const operation = useOperationStore((state) => state.operation);
  const operationPayload = useOperationStore((state) => state.requestPayload);
  const operationRequestId = useOperationStore((state) => state.requestId);
  const operationRequestPublicKey = useOperationStore(
    (state) => state.requestPublicKey
  );

  const resetOperationStore = useOperationStore((state) => state.clear);

  const lockKey = useKeysStore((state) => state.lockKey);
  const currentKey = useKeysStore((state) => state.currentKey);

  const signPayload =
    operationPayload &&
    operationPayload["signPayload"] &&
    hexToBytes(operationPayload["signPayload"]);
  const decodedPayload = signPayload && new TextDecoder().decode(signPayload);

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

    resetOperationStore();

    const operationResponseCommand =
      await OperationResponseCommandFactory.buildNew({
        from: CommandSource.POPUP_SCRIPT,
        requestId: operationRequestId,
        state: OperationStateType.ERROR,
        resultPayload: { reason: "User rejected." },
        encryptKey: operationRequestPublicKeyInstance,
      });

    await sendMsgToContentScript(
      ForwardToInjectScriptCommandFactory.buildNew({
        from: CommandSource.POPUP_SCRIPT,
        receivers: [CommandSource.INJECT_SCRIPT],
        forwardCommand: operationResponseCommand,
      })
    );

    console.log("after sendMsgToContentScript");
  };

  const signMessageHandle = async () => {
    if (!currentKey || !lockKey) {
      throw new Error("wallet not accessable");
      return;
    }
    if (currentKey.viewOnly) {
      throw new Error("view only wallet can not sign message");
    }

    if (!operationRequestId) {
      throw new Error("operationRequestId is not set");
    }
    if (!operationRequestPublicKey) {
      throw new Error("operationRequestPublicKey is not set");
    }

    const keypair = await restoreKeypair(currentKey, lockKey);

    const signature: string = bytesToHex(
      nacl.sign.detached(signPayload, keypair.secretKey)
    );

    const operationRequestPublicKeyInstance = await importPublicKey(
      operationRequestPublicKey
    );

    resetOperationStore();

    try {
      const operationResponseCommand =
        await OperationResponseCommandFactory.buildNew({
          from: CommandSource.POPUP_SCRIPT,
          requestId: operationRequestId,
          state: OperationStateType.COMPLETED,
          resultPayload: { signature },
          encryptKey: operationRequestPublicKeyInstance,
        });

      await sendMsgToContentScript(
        ForwardToInjectScriptCommandFactory.buildNew({
          from: CommandSource.POPUP_SCRIPT,
          receivers: [CommandSource.INJECT_SCRIPT],
          forwardCommand: operationResponseCommand,
        })
      );
    } catch (e) {
      console.error("signMessageHandle error", e);
      throw e;
    }

    window.close();
  };

  return (
    <div style={{ width: 400, wordWrap: "break-word" }}>
      <div>Current wallet: {currentKey?.name}</div>
      <div>------------</div>
      <h1>Sign Message</h1>
      <div className="card">
        <div>Payload to sign:</div>
        <div style={{ border: "1px solid red" }}>{decodedPayload}</div>
        <div>------------</div>
        <button onClick={rejectHandle}>Reject</button>
        <button onClick={signMessageHandle}>Sign</button>
      </div>
      <hr />
    </div>
  );
}

export default SignMessagePage;
