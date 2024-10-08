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
import { useEffect } from "react";
import { configConstants } from "../../common/configConstants.ts";
import {
  Divider,
  Stack,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import { YSpace } from "../components/common/YSpace.tsx";

function SignMessagePage() {
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

    clearOperation();

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
    <div
      style={{
        minWidth: configConstants.popout.width - 100,
        wordWrap: "break-word",
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

      <Divider />
      <YSpace height={10} />
      <Stack
        direction="row"
        spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Button variant="contained" color="error" onClick={rejectHandle}>
          Reject
        </Button>

        <Divider />

        <Button
          variant="contained"
          color="success"
          onClick={signMessageHandle}
          disabled={currentKey?.viewOnly}
        >
          Sign
        </Button>
      </Stack>
    </div>
  );
}

export default SignMessagePage;
