import { useKeysStore } from "../../../store/keysStore.ts";
import {
  generateNewKeypair,
  generateNewKeyRecord,
  generateNewViewOnlyKeyRecord,
} from "../../../store/keyRecord.ts";
import { useRef } from "react";
import { configConstants } from "../../../common/configConstants.ts";
import { toAddressShortName } from "../../../common/stringUtils.ts";
import { Box, Typography } from "@mui/material";

function KeyStorePage() {
  const password = useKeysStore((state) => state.lockKey);
  const keys = useKeysStore((state) => state.keys);
  const keyIndex = useKeysStore((state) => state.keyIndex);
  const currentKey = useKeysStore((state) => state.currentKey);
  const addKey = useKeysStore((state) => state.addKey);
  const removeKey = useKeysStore((state) => state.removeKey);
  const selectKey = useKeysStore((state) => state.selectKey);

  const viewOnlyWalletInputRef = useRef<HTMLInputElement>(null);

  return (
    <Box>
      <Typography gutterBottom variant="h5">
        Key store
      </Typography>
      <div className="card">
        <button
          onClick={async () =>
            password &&
            addKey(
              await generateNewKeyRecord(await generateNewKeypair(), password)
            )
          }
        >
          Generate new wallet
        </button>
      </div>
      <hr />
      <div className="card">
        <input type="text" width={300} ref={viewOnlyWalletInputRef} />
        <button
          onClick={async () => {
            const viewOnlyWalletPublicKey =
              viewOnlyWalletInputRef?.current?.value;
            if (!viewOnlyWalletPublicKey) {
              return;
            }
            addKey(await generateNewViewOnlyKeyRecord(viewOnlyWalletPublicKey));
          }}
        >
          Add view only wallet
        </button>
      </div>
      <hr />
      <div>
        Keys:
        <ul>
          {keys.map((key, i) => (
            <div key={i}>
              {keyIndex === i ? "*" : ""}{" "}
              <button onClick={() => selectKey(i)}>Select</button>
              <button
                onClick={() => navigator.clipboard.writeText(key.publicKey)}
              >
                Copy
              </button>
              {key.viewOnly ? "(View-only)" : ""}
              {key.name}: {toAddressShortName(key.publicKey)}
              <button onClick={() => removeKey(i)}>Remove key</button>
              <br />
            </div>
          ))}
        </ul>
      </div>
      {/* <div>keyIndex: {keyIndex}</div>
      <div>currentKey: {JSON.stringify(currentKey)}</div> */}
    </Box>
  );
}

export default KeyStorePage;
