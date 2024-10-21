import { useKeysStore } from "../../../store/keysStore.ts";
import { restoreKeypair } from "../../../store/keyRecord.ts";
import {
  OperationStateType,
  useOperationStore,
} from "../../../store/operationStore.ts";
import { sendMsgToContentScript } from "../../utils/messageUtils.ts";
import { hexToBytes } from "../../../common/encodingUtils.ts";
import { importPublicKey } from "../../../common/asymEncryptionUtils.ts";
import { ForwardToInjectScriptCommandFactory } from "../../../command/transport/forwardToInjectScriptCommand.ts";
import { OperationResponseCommandFactory } from "../../../command/operationResponseCommand.ts";
import { CommandSource } from "../../../command/base/baseCommandType.ts";
import { useEffect, useMemo, useState } from "react";
import * as web3 from "@solana/web3.js";
import {
  clusterApiUrl,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import { VersionedTransaction } from "@solana/web3.js";
import {
  parseTransaction,
  simulateTransaction,
  SimulateTransactionResult,
} from "../../../common/transactionUtils.ts";
import { SimulateTransactionResultView } from "../../components/simulationResult/SimulateTransactionResultView.tsx";
import { configConstants } from "../../../common/configConstants.ts";
import { Divider, Stack, Button, Typography, Box } from "@mui/material";
import { YSpace } from "../../components/common/YSpace.tsx";

function SignAndSendTxPage() {
  const operation = useOperationStore((state) => state.operation);
  const operationState = useOperationStore((state) => state.state);
  const operationPayload = useOperationStore((state) => state.requestPayload);
  const operationRequestId = useOperationStore((state) => state.requestId);
  const site = useOperationStore((state) => state.site);
  const operationRequestPublicKey = useOperationStore(
    (state) => state.requestPublicKey
  );

  const clearOperation = useOperationStore((state) => state.clear);

  const lockKey = useKeysStore((state) => state.lockKey);
  const currentKey = useKeysStore((state) => state.currentKey);

  const [state, setState] = useState<{
    simulateTransactionResult: SimulateTransactionResult | null;
  }>({ simulateTransactionResult: null });

  const connection = useMemo(
    () =>
      new web3.Connection(configConstants.defaultRpc.mainnet, {
        commitment: "confirmed",
      }),
    []
  );

  const tx: Transaction | VersionedTransaction | null = useMemo(() => {
    const txPayload: Uint8Array | null =
      (operationPayload &&
        operationPayload["encodedTransaction"] &&
        hexToBytes(operationPayload["encodedTransaction"])) ??
      null;

    return (txPayload && parseTransaction(txPayload)) ?? null;
  }, [operationPayload]);

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

    window.close();
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

    if (tx instanceof VersionedTransaction) {
      (tx as VersionedTransaction).sign([keypair]);
      txHash = await connection.sendTransaction(
        tx as VersionedTransaction,
        sendOptions
      );
    } else {
      txHash = await connection.sendTransaction(
        tx as Transaction,
        [keypair],
        sendOptions
      );
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

  useEffect(() => {
    if (!tx || !currentKey?.publicKey) {
      return;
    }

    (async () => {
      const simulateTransactionResult = await simulateTransaction(
        tx,
        connection,
        [currentKey.publicKey]
      );
      console.log("simulateTransactionResult", simulateTransactionResult);
      setState((prev) => ({ ...prev, simulateTransactionResult }));
    })();
  }, [connection, currentKey?.publicKey, tx]);

  const simulate = async () => {
    if (!tx || !currentKey?.publicKey) {
      return;
    }

    const simulateTransactionResult = await simulateTransaction(
      tx,
      connection,
      [currentKey.publicKey]
    );
    console.log("simulateTransactionResult", simulateTransactionResult);
    setState((prev) => ({ ...prev, simulateTransactionResult }));
  };

  const simulationResultView = useMemo(() => {
    if (currentKey?.publicKey && state.simulateTransactionResult) {
      return (
        <SimulateTransactionResultView
          walletOwner={currentKey.publicKey}
          result={state.simulateTransactionResult}
        />
      );
    }
    return null;
  }, [currentKey?.publicKey, state.simulateTransactionResult]);

  return (
    <Stack
      sx={{
        width: "100vw",
        height: "100vh",
        wordWrap: "break-word",
        paddingLeft: "10px",
        paddingRight: "10px",
      }}
    >
      <div>Current wallet: {currentKey?.name}</div>
      <Divider />
      <Typography gutterBottom variant="h6">
        Site: {site}
      </Typography>
      <Divider />
      <Typography gutterBottom variant="h5">
        Approve and Send Transaction
      </Typography>

      <Typography gutterBottom variant="h6">
        Simulation result:
      </Typography>

      <Box sx={{ flexGrow: 1, overflowY: "scroll" }}>
        {simulationResultView}
      </Box>

      <Divider />

      <Stack
        direction="row"
        spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          minHeight: "70px",
        }}
      >
        <Button variant="outlined" color="info" onClick={simulate}>
          re-simulate
        </Button>

        <Divider />

        <Button variant="outlined" color="error" onClick={rejectHandle}>
          Reject
        </Button>

        <Divider />

        <Button
          variant="contained"
          color="info"
          onClick={approveHandle}
          disabled={currentKey?.viewOnly}
        >
          Approve
        </Button>
      </Stack>
    </Stack>
  );
}

export default SignAndSendTxPage;
