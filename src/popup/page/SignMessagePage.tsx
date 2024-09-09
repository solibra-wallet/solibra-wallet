import { useKeysStore } from "../../store/keysStore.ts";
import { restoreKeypair } from "../../store/keyRecord";
import {
  OperationStateType,
  useOperationStore,
} from "../../store/operationStore.ts";
import { sendMsgToContentScript } from "../utils/messageUtils.ts";
import {
  base64DecodeToUint8Array,
  utf8StringToUint8Array,
} from "../../common/encodeDecodeUtils.ts";
import nacl from "tweetnacl";
import {
  encryptMessage,
  importPublicKey,
} from "../../common/asymEncryptionUtils.ts";
import { ForwardToInjectScriptCommandFactory } from "../../command/forwardToInjectScriptCommand.ts";
import { OperationResponseCommandFactory } from "../../command/operationResponseCommand.ts";
import { CommandSource } from "../../command/baseCommandType.ts";

function SignMessagePage() {
  const operation = useOperationStore((state) => state.operation);
  const operationPayload = useOperationStore((state) => state.requestPayload);
  const operationRequestId = useOperationStore((state) => state.requestId);
  const operationRequestPublicKey = useOperationStore(
    (state) => state.requestPublicKey
  );

  const setResult = useOperationStore((state) => state.setResult);

  const resetOperationStore = useOperationStore((state) => state.reset);

  const password = useKeysStore((state) => state.password);
  //   const keys = useKeysStore((state) => state.keys);
  //   const keyIndex = useKeysStore((state) => state.keyIndex);
  const currentKey = useKeysStore((state) => state.currentKey);
  //   const addKey = useKeysStore((state) => state.addKey);
  //   const removeKey = useKeysStore((state) => state.removeKey);
  //   const selectKey = useKeysStore((state) => state.selectKey);

  const signPayload =
    operationPayload &&
    operationPayload["signPayload"] &&
    base64DecodeToUint8Array(operationPayload["signPayload"]);
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
    const encryptedReason = await encryptMessage(
      operationRequestPublicKeyInstance,
      utf8StringToUint8Array("Rejected")
    );

    resetOperationStore();

    await sendMsgToContentScript(
      ForwardToInjectScriptCommandFactory.buildNew({
        from: CommandSource.POPUP_SCRIPT,
        receivers: [CommandSource.INJECT_SCRIPT],
        forwardCommand: OperationResponseCommandFactory.buildNew({
          from: CommandSource.POPUP_SCRIPT,
          requestId: operationRequestId,
          state: OperationStateType.ERROR,
          resultPayload: { reason: encryptedReason },
        }),
      })
    );

    window.close();
  };

  const signMessageHandle = async () => {
    if (!currentKey || !password) {
      throw new Error("wallet not accessable");
      return;
    }
    if (currentKey.viewOnly) {
      throw new Error("view only wallet can not sign message");
    }

    const keypair = await restoreKeypair(currentKey, password);

    const signature: Uint8Array = nacl.sign.detached(
      signPayload,
      keypair.secretKey
    );

    if (!operationRequestId) {
      throw new Error("operationRequestId is not set");
    }
    if (!operationRequestPublicKey) {
      throw new Error("operationRequestPublicKey is not set");
    }

    const operationRequestPublicKeyInstance = await importPublicKey(
      operationRequestPublicKey
    );
    const encryptedSignature = await encryptMessage(
      operationRequestPublicKeyInstance,
      signature
    );

    // setResult({
    //   requestId: operationRequestId,
    //   state: OperationStateType.COMPLETED,
    //   resultPayload: { signature: encryptedSignature },
    // });
    resetOperationStore();

    await sendMsgToContentScript(
      ForwardToInjectScriptCommandFactory.buildNew({
        from: CommandSource.POPUP_SCRIPT,
        receivers: [CommandSource.INJECT_SCRIPT],
        forwardCommand: OperationResponseCommandFactory.buildNew({
          from: CommandSource.POPUP_SCRIPT,
          requestId: operationRequestId,
          state: OperationStateType.COMPLETED,
          resultPayload: { signature: encryptedSignature },
        }),
      })
    );

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
        <button onClick={rejectHandle}>Reject</button>
        <button onClick={signMessageHandle}>Sign</button>
      </div>
      <hr />
    </div>
  );
}

export default SignMessagePage;
