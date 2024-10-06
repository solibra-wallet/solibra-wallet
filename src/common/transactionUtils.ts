import {
  AccountInfo,
  AddressLookupTableAccount,
  AddressLookupTableProgram,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  Transaction,
  TransactionVersion,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import BigNumber from "bignumber.js";
import {
  base64Decode,
  base64DecodeToRawBytes,
  bytesToHex,
} from "./encodingUtils";
import {
  Account,
  getMint,
  getTokenMetadata,
  Mint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  unpackAccount,
} from "@solana/spl-token";
import { Decimal, removeNumberTrailingZeros } from "./numberUtils";

export const parseTransaction = (
  txBytes: Uint8Array
): Transaction | VersionedTransaction => {
  let tx: Transaction | VersionedTransaction | null = null;

  try {
    tx = VersionedTransaction.deserialize(txBytes) ?? null;
  } catch (e) {
    try {
      tx = Transaction.from(txBytes) ?? null;
    } catch (e) {
      // Do nothing
    }
  }

  if (tx === null) {
    throw new Error("Failed to parse transaction");
  }
  return tx;
};

export const parseVersionedMessage = (bytes: Uint8Array) => {
  const message = VersionedMessage.deserialize(bytes);
  if (message === null) {
    throw new Error("Failed to parse transaction");
  }
  return message;
};

export const fetchAccountAddresses = async (connection: Connection) => {};

export type AccountChangeType = {
  publicKey: string;
  solBalance: {
    beforeBalance: string;
    afterBalance: string;
    balanceDiff: string;
  } | null;
  tokenBalance: {
    token: {
      mint: string;
      name: string;
      symbol: string;
      decimals: number;
      logoURI: string | null;
    };
    owner: string;
    beforeBalance: string;
    afterBalance: string;
    balanceDiff: string;
  } | null;
};

export type SimulateTransactionResult = {
  simulationResponse: RpcResponseAndContext<SimulatedTransactionResponse>;
  writableSigners: PublicKey[];
  readOnlySigners: PublicKey[];
  writableNonSignerAccounts: PublicKey[];
  accountChanges: AccountChangeType[];
};

const _getTxSignerWriteAccounts = async (
  tx: Transaction | VersionedTransaction,
  connection: Connection
): Promise<{
  writableSigners: PublicKey[];
  readOnlySigners: PublicKey[];
  writableNonSignerAccounts: PublicKey[];
}> => {
  let writableSigners: PublicKey[] = [];
  let readOnlySigners: PublicKey[] = [];
  let writableNonSignerAccounts: PublicKey[] = [];
  const accountChanges: AccountChangeType[] = [];

  if (tx instanceof VersionedTransaction) {
    const lookupTableAccountList: AddressLookupTableAccount[] = [];
    for (const key of tx.message.addressTableLookups.map((_) => _.accountKey)) {
      const accountInfo = await connection.getAccountInfo(key);
      if (
        accountInfo?.data &&
        accountInfo.owner.equals(AddressLookupTableProgram.programId)
      ) {
        try {
          const lookupTableAccount = new AddressLookupTableAccount({
            key: key,
            state: AddressLookupTableAccount.deserialize(accountInfo.data),
          });
          lookupTableAccountList.push(lookupTableAccount);
        } catch (e) {
          console.error(
            "Failed to deserialize address lookup table account",
            e
          );
        }
      }
    }

    const message = tx.message;

    const messageAccountKeys = message.getAccountKeys({
      addressLookupTableAccounts: lookupTableAccountList,
    });

    writableSigners = message.staticAccountKeys.slice(
      0,
      message.header.numRequiredSignatures -
        message.header.numReadonlySignedAccounts
    );

    readOnlySigners = message.staticAccountKeys.slice(
      message.header.numRequiredSignatures -
        message.header.numReadonlySignedAccounts,
      message.header.numReadonlySignedAccounts
    );

    writableNonSignerAccounts = [
      ...message.staticAccountKeys.filter(
        (_, i) => !message.isAccountSigner(i) && message.isAccountWritable(i)
      ),
      ...(messageAccountKeys.accountKeysFromLookups?.writable ?? []),
    ];
  } else {
    const message = tx.compileMessage();

    writableSigners = message.accountKeys.slice(
      0,
      message.header.numRequiredSignatures -
        message.header.numReadonlySignedAccounts
    );
    readOnlySigners = message.accountKeys.slice(
      message.header.numRequiredSignatures -
        message.header.numReadonlySignedAccounts
    );
    writableNonSignerAccounts = message.accountKeys.filter(
      (_, i) => !message.isAccountSigner(i) && message.isAccountWritable(i)
    );
  }

  return {
    writableSigners,
    readOnlySigners,
    writableNonSignerAccounts,
  };
};

const _getSimulatedTransactionResponse = async (
  tx: Transaction | VersionedTransaction,
  checkAccounts: PublicKey[],
  connection: Connection
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> => {
  if (tx instanceof VersionedTransaction) {
    return await connection.simulateTransaction(tx, {
      replaceRecentBlockhash: true,
      commitment: connection.commitment,
      accounts: {
        encoding: "base64",
        addresses: checkAccounts.map((key) => key.toBase58()),
      },
    });
  } else {
    const message = tx.compileMessage();
    return await connection.simulateTransaction(tx, [], checkAccounts);
  }
};

export const simulateTransaction = async (
  tx: Transaction | VersionedTransaction,
  connection: Connection,
  pinAccounts: string[]
): Promise<SimulateTransactionResult> => {
  const { writableSigners, readOnlySigners, writableNonSignerAccounts } =
    await _getTxSignerWriteAccounts(tx, connection);

  const writableAccounts = [...writableSigners, ...writableNonSignerAccounts];

  const simulationResponse: RpcResponseAndContext<SimulatedTransactionResponse> =
    await _getSimulatedTransactionResponse(tx, writableAccounts, connection);

  const accountChanges: AccountChangeType[] = [];

  const writableAccountsBeforeInfo: (AccountInfo<Buffer> | null)[] =
    await connection.getMultipleAccountsInfo(writableAccounts, {
      commitment: connection.commitment,
    });

  if (!simulationResponse) {
    console.error("Failed to simulate transaction");
    return {
      simulationResponse,
      writableSigners,
      readOnlySigners,
      writableNonSignerAccounts,
      accountChanges,
    };
  }

  const tokenMetadataCache = new Map<string, any>();

  for (const [i, resultAccount] of (
    simulationResponse.value.accounts ?? []
  ).entries()) {
    if (!resultAccount) {
      continue;
    }
    let solBalanceChange: AccountChangeType["solBalance"] = null;
    let tokenBalanceChange: AccountChangeType["tokenBalance"] = null;

    if (typeof resultAccount?.lamports === "number") {
      const beforeBalanceValue = new Decimal(
        writableAccountsBeforeInfo[i]?.lamports ?? 0
      ).dividedBy(LAMPORTS_PER_SOL);
      const afterBalanceValue = new Decimal(resultAccount.lamports).dividedBy(
        LAMPORTS_PER_SOL
      );
      const balanceDiffValue = afterBalanceValue.minus(beforeBalanceValue);

      if (!balanceDiffValue.isZero()) {
        solBalanceChange = {
          beforeBalance: removeNumberTrailingZeros(
            beforeBalanceValue.toString()
          ),
          afterBalance: removeNumberTrailingZeros(afterBalanceValue.toString()),
          balanceDiff:
            (balanceDiffValue.isPositive() ? "+" : "") +
            removeNumberTrailingZeros(balanceDiffValue.toString()),
        };
      }
    }

    if (
      resultAccount.owner === TOKEN_PROGRAM_ID.toBase58() ||
      resultAccount.owner === TOKEN_2022_PROGRAM_ID.toBase58()
    ) {
      const tokenProgram = new PublicKey(resultAccount.owner);

      let afterTokenAccount: Account;
      try {
        afterTokenAccount = unpackAccount(
          writableAccounts[i],
          {
            ...resultAccount,
            owner: new PublicKey(resultAccount.owner),
            data: Buffer.from(resultAccount.data[0], "base64"),
          },
          tokenProgram
        );
      } catch (e) {
        console.error("Failed to unpack token account", e);
        continue;
      }

      const mint = await getMint(
        connection,
        afterTokenAccount.mint,
        connection.commitment,
        tokenProgram
      );

      let tokenMetadata: any = tokenMetadataCache.has(
        afterTokenAccount.mint.toBase58()
      )
        ? tokenMetadataCache.get(afterTokenAccount.mint.toBase58())
        : null;

      if (tokenMetadata == null) {
        tokenMetadata = await (
          await fetch(`https://api.jup.ag/tokens/v1/${afterTokenAccount.mint}`)
        ).json();
        tokenMetadataCache.set(
          afterTokenAccount.mint.toBase58(),
          tokenMetadata
        );
      }
      const tokenName = "" + (tokenMetadata?.name ?? "Unknown Token");
      const tokenSymbol = "" + (tokenMetadata?.symbol ?? "Unknown Token");
      const tokenLogoURI = tokenMetadata?.logoURI
        ? "" + tokenMetadata?.logoURI
        : null;

      const beforeTokenAccount =
        (writableAccountsBeforeInfo[i] &&
          unpackAccount(
            writableAccounts[i],
            writableAccountsBeforeInfo[i],
            new PublicKey(resultAccount.owner)
          )) ??
        null;

      const afterTokenBalance = new Decimal(
        afterTokenAccount.amount.toString()
      ).dividedBy(new Decimal(10).pow(mint.decimals));

      const beforeTokenBalance = beforeTokenAccount
        ? new Decimal(beforeTokenAccount.amount.toString()).dividedBy(
            new Decimal(10).pow(mint.decimals)
          )
        : new Decimal("0");

      const balanceDiffValue = afterTokenBalance.minus(beforeTokenBalance);

      if (!balanceDiffValue.isZero()) {
        tokenBalanceChange = {
          token: {
            mint: afterTokenAccount.mint.toBase58(),
            name: tokenName,
            symbol: tokenSymbol,
            decimals: mint.decimals,
            logoURI: tokenLogoURI,
          },
          owner: afterTokenAccount.owner.toBase58(),
          beforeBalance: removeNumberTrailingZeros(
            beforeTokenBalance.toString()
          ),
          afterBalance: removeNumberTrailingZeros(afterTokenBalance.toString()),
          balanceDiff:
            (balanceDiffValue.isPositive() ? "+" : "") +
            removeNumberTrailingZeros(balanceDiffValue.toString()),
        };
      }
    }

    if (resultAccount.data) {
      const before =
        (writableAccountsBeforeInfo[i] &&
          bytesToHex(Uint8Array.from(writableAccountsBeforeInfo[i].data))) ??
        "";
      const after = bytesToHex(base64DecodeToRawBytes(resultAccount.data[0]));
      if (before !== after) {
        console.log("account data diff", writableAccounts[i].toBase58(), {
          before,
          after,
        });
      }
    }

    if (solBalanceChange || tokenBalanceChange) {
      accountChanges.push({
        publicKey: writableAccounts[i].toBase58(),
        solBalance: solBalanceChange,
        tokenBalance: tokenBalanceChange,
      });
    }
  }

  accountChanges.sort((a, b) => {
    if (
      pinAccounts.includes(a.publicKey) &&
      !pinAccounts.includes(b.publicKey)
    ) {
      return -1;
    } else if (
      !pinAccounts.includes(a.publicKey) &&
      pinAccounts.includes(b.publicKey)
    ) {
      return 1;
    } else if (
      pinAccounts.includes(a.publicKey) &&
      pinAccounts.includes(b.publicKey)
    ) {
      return pinAccounts.indexOf(b.publicKey) < pinAccounts.indexOf(a.publicKey)
        ? 1
        : -1;
    }

    if (
      pinAccounts.includes(a.tokenBalance?.owner ?? "") &&
      !pinAccounts.includes(b.tokenBalance?.owner ?? "")
    ) {
      return -1;
    } else if (
      !pinAccounts.includes(a.tokenBalance?.owner ?? "") &&
      pinAccounts.includes(b.tokenBalance?.owner ?? "")
    ) {
      return 1;
    } else if (
      pinAccounts.includes(a.tokenBalance?.owner ?? "") &&
      pinAccounts.includes(b.tokenBalance?.owner ?? "")
    ) {
      return pinAccounts.indexOf(b.tokenBalance?.owner ?? "") <
        pinAccounts.indexOf(a.tokenBalance?.owner ?? "")
        ? 1
        : -1;
    }

    return -1;
  });

  return {
    simulationResponse: {
      ...simulationResponse,
      value: { ...simulationResponse.value, accounts: null },
    },
    writableSigners,
    readOnlySigners,
    writableNonSignerAccounts,
    accountChanges,
  };
};
