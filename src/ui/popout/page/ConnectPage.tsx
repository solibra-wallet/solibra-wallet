import { useKeysStore } from "../../../store/keysStore.ts";
import {
  encryptOperationResultPayload,
  OperationRecord,
  OperationStateType,
  useOperationStore,
} from "../../../store/operationStore.ts";
import { sendMsgToContentScript } from "../../utils/messageUtils.ts";
import { importPublicKey } from "../../../common/asymEncryptionUtils.ts";
import { ForwardToInjectScriptCommandFactory } from "../../../command/transport/forwardToInjectScriptCommand.ts";
import { OperationResponseCommandFactory } from "../../../command/operationResponseCommand.ts";
import { CommandSource } from "../../../command/base/baseCommandType.ts";
import { useEffect } from "react";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";

function ConnectPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const operationRequestId = searchParams.get("requestId");
  const getOperationRecord = useOperationStore((state) => state.getOperationRecord);

  const operationRecord :  OperationRecord | null = operationRequestId ? getOperationRecord(operationRequestId, Date.now()) : null;
  const operationState = operationRecord?.state ?? null;
  const site =   operationRecord?.site ?? null;
  const operationRequestPublicKey = operationRecord?.requestPublicKey ?? null;
  const setOperationResult = useOperationStore((state) => state.setOperationResult);
  const currentKey = useKeysStore((state) => state.currentKey);

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

    const encryptedResultPayload = await encryptOperationResultPayload(
      { reason: "User rejected." },
      operationRequestPublicKeyInstance
    )
    setOperationResult(operationRequestId, OperationStateType.ERROR, encryptedResultPayload, Date.now());

    await sendMsgToContentScript(
      ForwardToInjectScriptCommandFactory.buildNew({
        from: CommandSource.POPUP_SCRIPT,
        receivers: [CommandSource.INJECT_SCRIPT],
        forwardCommand: await OperationResponseCommandFactory.buildNew({
          from: CommandSource.POPUP_SCRIPT,
          requestId: operationRequestId,
          state: OperationStateType.ERROR,
          encryptedResultPayload
        }),
      })
    );

    window.close();
  };

  // handle user approve connect
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

    const encryptedResultPayload = await encryptOperationResultPayload(
      { publicKey: currentKey.publicKey },
      operationRequestPublicKeyInstance
    )
    setOperationResult(operationRequestId, OperationStateType.COMPLETED, encryptedResultPayload, Date.now());

    await sendMsgToContentScript(
      ForwardToInjectScriptCommandFactory.buildNew({
        from: CommandSource.POPUP_SCRIPT,
        receivers: [CommandSource.INJECT_SCRIPT],
        forwardCommand: await OperationResponseCommandFactory.buildNew({
          from: CommandSource.POPUP_SCRIPT,
          requestId: operationRequestId,
          state: OperationStateType.COMPLETED,
          encryptedResultPayload
        }),
      })
    );

    window.close();
  };

  // handle window close => close error
  useEffect(() => {
    window.addEventListener("beforeunload", function () {
      if (operationState !== OperationStateType.PENDING) {
        return;
      }

      if (operationRequestId) {
        setOperationResult(operationRequestId, OperationStateType.ERROR, null, Date.now());
      }

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
        Connect to site request
      </Typography>

      <Box sx={{ flexGrow: 1 }}></Box>

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
        <Button variant="outlined" color="error" onClick={rejectHandle}>
          Reject
        </Button>

        <Divider />

        <Button variant="outlined" color="info" onClick={connectHandle}>
          Connect
        </Button>
      </Stack>
    </Stack>
  );
}

export default ConnectPage;
