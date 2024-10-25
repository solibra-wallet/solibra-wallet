import { useKeysStore } from "../../../store/keysStore.ts";
import { restoreKeypair } from "../../../store/keyRecord.ts";
import {
  encryptOperationResultPayload,
  OperationRecord,
  OperationStateType,
  useOperationStore,
} from "../../../store/operationStore.ts";
import { sendMsgToContentScript } from "../../utils/messageUtils.ts";
import { bytesToHex, hexToBytes } from "../../../common/encodingUtils.ts";
import nacl from "tweetnacl";
import { importPublicKey } from "../../../common/asymEncryptionUtils.ts";
import { ForwardToInjectScriptCommandFactory } from "../../../command/transport/forwardToInjectScriptCommand.ts";
import { OperationResponseCommandFactory } from "../../../command/operationResponseCommand.ts";
import { CommandSource } from "../../../command/base/baseCommandType.ts";
import { useEffect } from "react";
import {
  Divider,
  Stack,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";

function SignMessagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const operationRequestId = searchParams.get("requestId");
  const getOperationRecord = useOperationStore((state) => state.getOperationRecord);

  const operationRecord :  OperationRecord | null = operationRequestId ? getOperationRecord(operationRequestId, Date.now()) : null;
  const operationState = operationRecord?.state ?? null;
  const operationPayload = operationRecord?.requestPayload ??null;
  const site =   operationRecord?.site ?? null;
  const operationRequestPublicKey = operationRecord?.requestPublicKey ?? null;
  const setOperationResult = useOperationStore((state) => state.setOperationResult);

  const lockKey = useKeysStore((state) => state.lockKey);
  const currentKey = useKeysStore((state) => state.currentKey);

  const signPayload =
    operationPayload &&
    operationPayload["signPayload"] &&
    hexToBytes(operationPayload["signPayload"]);
  const decodedPayload = signPayload && new TextDecoder().decode(signPayload);

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

    const operationResponseCommand =
      await OperationResponseCommandFactory.buildNew({
        from: CommandSource.POPUP_SCRIPT,
        requestId: operationRequestId,
        state: OperationStateType.ERROR,
        encryptedResultPayload
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

    const encryptedResultPayload = await encryptOperationResultPayload(
      { signature },
      operationRequestPublicKeyInstance
    )
    setOperationResult(operationRequestId, OperationStateType.ERROR, encryptedResultPayload, Date.now());


    try {
      const operationResponseCommand =
        await OperationResponseCommandFactory.buildNew({
          from: CommandSource.POPUP_SCRIPT,
          requestId: operationRequestId,
          state: OperationStateType.COMPLETED,
          encryptedResultPayload
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

  // handle window close => close error
  useEffect(() => {
    window.addEventListener("beforeunload", function (e) {
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
        Sign Message
      </Typography>

      <div>Payload to sign:</div>
      <Card>
        <CardContent>{decodedPayload}</CardContent>
      </Card>

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

        <Button
          variant="outlined"
          color="info"
          onClick={signMessageHandle}
          disabled={currentKey?.viewOnly}
        >
          Sign
        </Button>
      </Stack>
    </Stack>
  );
}

export default SignMessagePage;
