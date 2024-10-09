# solibra-wallet

install:
```
npm i
```

build:
```
npm run build
```

----------

Guide for development:
1) run build.
2) Then the extension is compiled in "dist".
3) import the extension in chrome (developer mode).

----------

Dev testing

Currently, it is hardcode to use mainnet (Not yet implement RPC config). Can do manual test on:
- https://devnet.jup.ag/
- https://drip.haus/

Supported function at 8/10/2024:
- Generate random wallet
- Add view-only-wallet
- Sign message
- Sign transaction with simulation
