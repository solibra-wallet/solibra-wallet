import { useKeysStore } from "../../store/keysStore.ts";
import {
  generateNewKeypair,
  generateNewKeyRecord,
  generateNewViewOnlyKeyRecord,
  restoreKeypair,
} from "../../store/keyRecord.ts";
import { useRef } from "react";
import {
  OperationStateType,
  useOperationStore,
} from "../../store/operationStore.ts";
import {
  sendMsgToBackground,
  sendMsgToContentScript,
} from "../utils/messageUtils.ts";
import {
  base64DecodeToUint8Array,
  utf8StringToUint8Array,
} from "../../common/encodeDecodeUtils.ts";
import nacl from "tweetnacl";
import { syncStoreAcrossRuntime } from "../../store/asyncLocalStorage.ts";
import {
  encryptMessage,
  importPublicKey,
} from "../../common/asymEncryptionUtils.ts";
import { ForwardToInjectScriptCommandFactory } from "../../command/forwardToInjectScriptCommand.ts";
import { OperationResponseCommandFactory } from "../../command/operationResponseCommand.ts";
import { CommandSource } from "../../command/baseCommandType.ts";
import { PublicKey } from "@solana/web3.js";

function ConnectPage() {
  const operation = useOperationStore((state) => state.operation);
  const operationPayload = useOperationStore((state) => state.requestPayload);
  const operationRequestId = useOperationStore((state) => state.requestId);
  const operationRequestPublicKey = useOperationStore(
    (state) => state.requestPublicKey
  );

  const setResult = useOperationStore((state) => state.setResult);

  const resetOperationStore = useOperationStore((state) => state.reset);

  // const password = useKeysStore((state) => state.password);
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
    const encryptedPublicKey = await encryptMessage(
      operationRequestPublicKeyInstance,
      new PublicKey(currentKey.publicKey).toBytes()
    );

    setResult({
      requestId: operationRequestId,
      state: OperationStateType.COMPLETED,
      resultPayload: { publicKey: encryptedPublicKey },
    });

    await sendMsgToContentScript(
      ForwardToInjectScriptCommandFactory.buildNew({
        from: CommandSource.POPUP_SCRIPT,
        receivers: [CommandSource.INJECT_SCRIPT],
        forwardCommand: OperationResponseCommandFactory.buildNew({
          from: CommandSource.POPUP_SCRIPT,
          requestId: operationRequestId,
          state: OperationStateType.COMPLETED,
          resultPayload: { publicKey: encryptedPublicKey },
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
        <div style={{ border: "1px solid red" }}>{decodedPayload}</div>
        <button onClick={rejectHandle}>Reject</button>
        <button onClick={connectHandle}>Connect</button>
      </div>
      <hr />
    </div>
  );
}

export default ConnectPage;
