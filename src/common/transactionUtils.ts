import {
  Connection,
  Transaction,
  TransactionVersion,
  VersionedTransaction,
} from "@solana/web3.js";

export const parseTransaction = (
  txBytes: Uint8Array
): Transaction | VersionedTransaction => {
  let tx: Transaction | VersionedTransaction | null = null;

  try {
    tx = VersionedTransaction.deserialize(txBytes) ?? null;
  } catch (e) {
    tx = Transaction.from(txBytes) ?? null;
  }

  return tx;
};

// export const simulateTransaction = async (
//   tx: Transaction | VersionedTransaction,
//   connection: Connection
// ): Promise<string> => {
//   if (tx instanceof VersionedTransaction) {
//     const simulationResponse = await connection.simulateTransaction(tx, {
//       replaceRecentBlockhash: true,
//     });
//   } else {
//     return await connection.simulateTransaction(tx);
//   }
// };
