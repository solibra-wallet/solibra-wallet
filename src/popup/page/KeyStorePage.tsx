import { useKeysStore } from "../../store/keysStore.ts";
import {
  generateNewKeypair,
  generateNewKeyRecord,
  generateNewViewOnlyKeyRecord,
} from "../../store/keyRecord";
import { useRef } from "react";

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
    <div style={{ width: 400, wordWrap: "break-word" }}>
      <h1>Key store</h1>
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
              {key.viewOnly ? "(Viewable)" : ""}
              {key.name}: {key.publicKey.slice(0, 5)}...
              {key.publicKey.slice(key.publicKey.length - 4)}
              <button onClick={() => removeKey(i)}>Remove key</button>
              <br />
            </div>
          ))}
        </ul>
      </div>
      {/* <div>keyIndex: {keyIndex}</div>
      <div>currentKey: {JSON.stringify(currentKey)}</div> */}
    </div>
  );
}

export default KeyStorePage;
