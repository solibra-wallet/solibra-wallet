import {
  Keypair,
  PublicKey,
  SendOptions,
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { Solibra, SolibraEvent } from "../wallet-standard/window";
import {
  SolanaSignInInput,
  SolanaSignInOutput,
} from "@solana/wallet-standard-features";
import { sendMsgToBackground, sendMsgToContentScript } from "./messageUtils";
import {
  ConnectRequestCommand,
  ConnectRequestCommandFactory,
} from "../command/connectRequestCommand";
import { CommandSource } from "../command/baseCommand";
import { EventEmitter } from "eventemitter3";

export class SolibraImpl implements Solibra {
  #publicKey: PublicKey | null = null;
  #eventEmitter = new EventEmitter();

  get publicKey(): PublicKey | null {
    return this.#publicKey;
  }

  async connect(options?: {
    onlyIfTrusted?: boolean;
  }): Promise<{ publicKey: PublicKey | null }> {
    console.log("SolibraWallet connect");
    const res = await sendMsgToBackground(
      ConnectRequestCommandFactory.buildNew(CommandSource.INJECT_SCRIPT)
    );
    if (res.publicKey) {
      this.#publicKey = new PublicKey(res.publicKey);
    }

    return { publicKey: this.publicKey };
  }
  async disconnect(): Promise<void> {
    console.log("SolibraWallet disconnect");
    // throw new Error("Method not implemented.");
  }
  signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions
  ): Promise<{ signature: TransactionSignature }> {
    console.log("SolibraWallet sign and send transaction");
    throw new Error("Method not implemented.");
  }
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    console.log("SolibraWallet sign transaction");
    throw new Error("Method not implemented.");
  }
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> {
    console.log("SolibraWallet sign all transactions");
    throw new Error("Method not implemented.");
  }
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }> {
    console.log("SolibraWallet sign message");
    throw new Error("Method not implemented.");
  }
  signIn(input?: SolanaSignInInput): Promise<SolanaSignInOutput> {
    console.log("SolibraWallet sign in");
    throw new Error("Method not implemented.");
  }
  on<E extends keyof SolibraEvent>(
    event: E,
    listener: SolibraEvent[E],
    context?: any
  ): void {
    console.log("SolibraWallet on", event);
    this.#eventEmitter.on(event, listener);
  }
  off<E extends keyof SolibraEvent>(
    event: E,
    listener: SolibraEvent[E],
    context?: any
  ): void {
    console.log("SolibraWallet off", event);
    this.#eventEmitter.off(event, listener);
  }
  async reloadAccount() {
    await this.connect();
    this.#eventEmitter.emit("accountChanged");
  }
}
