import { useKeysStore } from '../store/keysStore';
import { generateNewKeyRecord } from '../store/keyRecord';


function KeyStorePage() {
  const password = useKeysStore((state) => state.password);
  const keys = useKeysStore((state) => state.keys);
  const keyIndex = useKeysStore((state) => state.keyIndex);
  const currentKey = useKeysStore((state) => state.currentKey);
  const addKey = useKeysStore((state) => state.addKey);
  const removeKey = useKeysStore((state) => state.removeKey);

  return (
    <div style={{ width: 400, wordWrap: 'break-word' }}>
      <h1>Key store</h1>
      <div>
        Keys:
        <ul>
          {keys.map((key, i) => (
            <div key={i}>
              {key.name}: {key.publicKey}
              <br />
            </div>
          ))}
        </ul>
      </div>
      <div>
        keyIndex: {keyIndex}
      </div>
      <div>
        currentKey: {JSON.stringify(currentKey)}
      </div>
      <div className="card">
        <button onClick={async () => password && addKey(await generateNewKeyRecord(password))}>
          Add key
        </button>
        <button onClick={() => removeKey(0)}>
          Remove key
        </button>
      </div>
    </div>
  )
}

export default KeyStorePage
