import { useKeysStore } from "../../store/keysStore.ts";
import { restoreKeypair } from "../../store/keyRecord.ts";
import {
  OperationStateType,
  useOperationStore,
} from "../../store/operationStore.ts";
import { sendMsgToContentScript } from "../utils/messageUtils.ts";
import { hexToBytes } from "../../common/encodingUtils.ts";
import { importPublicKey } from "../../common/asymEncryptionUtils.ts";
import { ForwardToInjectScriptCommandFactory } from "../../command/transport/forwardToInjectScriptCommand.ts";
import { OperationResponseCommandFactory } from "../../command/operationResponseCommand.ts";
import { CommandSource } from "../../command/base/baseCommandType.ts";
import { useEffect } from "react";
import * as web3 from "@solana/web3.js";
import {
  clusterApiUrl,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import { VersionedTransaction } from "@solana/web3.js";

function SignAndSendTxPage() {
  const operation = useOperationStore((state) => state.operation);
  const operationState = useOperationStore((state) => state.state);
  const operationPayload = useOperationStore((state) => state.requestPayload);
  const operationRequestId = useOperationStore((state) => state.requestId);
  const operationRequestPublicKey = useOperationStore(
    (state) => state.requestPublicKey
  );

  const clearOperation = useOperationStore((state) => state.clear);

  const lockKey = useKeysStore((state) => state.lockKey);
  const currentKey = useKeysStore((state) => state.currentKey);

  const txPayload: Uint8Array | null =
    (operationPayload &&
      operationPayload["encodedTransaction"] &&
      hexToBytes(operationPayload["encodedTransaction"])) ??
    null;

  let isLegacyTx = false;
  let tx: Transaction | VersionedTransaction | null = null;

  try {
    tx = (txPayload && VersionedTransaction.deserialize(txPayload)) ?? null;
  } catch (e) {
    isLegacyTx = true;
    tx = (txPayload && Transaction.from(txPayload)) ?? null;
  }

  const sendOptions = operationPayload["sendOptions"] ?? undefined;

  // handle user reject
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

  // handle user approve sign message
  const approveHandle = async () => {
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

    if (!tx) {
      throw new Error("Cannot deserialize transaction");
    }

    let txHash: TransactionSignature | null = null;

    if (isLegacyTx) {
      txHash = await new web3.Connection(
        clusterApiUrl("devnet")
      ).sendTransaction(tx as Transaction, [keypair], sendOptions);
    } else {
      (tx as VersionedTransaction).sign([keypair]);
      txHash = await new web3.Connection(
        clusterApiUrl("devnet")
      ).sendTransaction(tx as VersionedTransaction, sendOptions);
    }

    const operationRequestPublicKeyInstance = await importPublicKey(
      operationRequestPublicKey
    );

    clearOperation();

    try {
      const operationResponseCommand =
        await OperationResponseCommandFactory.buildNew({
          from: CommandSource.POPUP_SCRIPT,
          requestId: operationRequestId,
          state: OperationStateType.COMPLETED,
          resultPayload: { signature: txHash },
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
      console.error("approveHandle error", e);
      throw e;
    }

    window.close();
  };

  // handle window close => close error
  useEffect(() => {
    window.addEventListener("beforeunload", function (e) {
      if (operationState !== OperationStateType.PENDING) {
        return;
      }
      clearOperation();

      sendMsgToContentScript(
        ForwardToInjectScriptCommandFactory.buildNew({
          from: CommandSource.POPUP_SCRIPT,
          receivers: [CommandSource.INJECT_SCRIPT],
          forwardCommand:
            OperationResponseCommandFactory.buildNewWithoutResultPayload({
              from: CommandSource.POPUP_SCRIPT,
              requestId: operationRequestId!,
              state: OperationStateType.ERROR,
            }),
        })
      );
    });
  });

  return (
    <div style={{ width: 400, wordWrap: "break-word" }}>
      <div>Current wallet: {currentKey?.name}</div>
      <div>------------</div>
      <h1>Approve and Send Transaction</h1>
      <div className="card">
        <div>tx to sign:</div>
        <div style={{ border: "1px solid red" }}>{JSON.stringify(tx)}</div>
        <div>------------</div>
        <button onClick={rejectHandle}>Reject</button>
        <button onClick={approveHandle}>Approve</button>
      </div>
      <hr />
    </div>
  );
}

export default SignAndSendTxPage;
