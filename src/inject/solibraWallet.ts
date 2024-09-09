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
import { sendMsgToContentScript } from "./messageUtils";
import { ConnectRequestCommandFactory } from "../command/connectRequestCommand";
import { CommandSource } from "../command/baseCommandType";
import { EventEmitter } from "eventemitter3";
import { sleep } from "../common/sleep";
import { SignMessageRequestCommandFactory } from "../command/signMessageRequestCommand";
import { OperationStateType } from "../store/operationStore";
import {
  decryptMessage,
  exportPublicKey,
  generateKeyPair,
} from "../common/asymEncryptionUtils";
import { v4 as uuidv4 } from "uuid";
import {
  base64Encode,
  base64EncodeFromUint8Array,
} from "../common/encodeDecodeUtils";

export class SolibraWallet implements Solibra {
  #publicKey: PublicKey | null = null;
  #eventEmitter = new EventEmitter();

  #operationRequestId: string | null = null;
  #operationState: OperationStateType = OperationStateType.IDLE;
  #operationResultPayload: Record<string, any> = {};

  get publicKey(): PublicKey | null {
    return this.#publicKey;
  }

  async connect(options?: {
    onlyIfTrusted?: boolean;
  }): Promise<{ publicKey: PublicKey | null }> {
    console.log("SolibraWallet connect");

    // sendMsgToContentScript(
    //   ConnectRequestCommandFactory.buildNew({
    //     from: CommandSource.INJECT_SCRIPT,
    //   })
    // );

    // for (let i = 0; i < 10000; i++) {
    //   if (!this.publicKey) {
    //     await sleep(200);
    //   } else {
    //     break;
    //   }
    // }
    // if (!this.publicKey) {
    //   throw new Error("Connect wallet timeout.");
    // }

    // return { publicKey: this.publicKey };

    const operationRequestId = uuidv4();
    const encryptKeyPair = await generateKeyPair();

    const exportedPublicKey = await exportPublicKey(encryptKeyPair.publicKey);

    this.startWaitOperation({ operationRequestId });

    await sendMsgToContentScript(
      ConnectRequestCommandFactory.buildNew({
        from: CommandSource.INJECT_SCRIPT,
        operationRequestId,
        operationRequestPublicKey: exportedPublicKey,
        site: window.location.origin,
      })
    );

    for (let i = 0; i < 10000; i++) {
      if (this.#operationRequestId !== operationRequestId) {
        break;
      }

      if (this.#operationState === OperationStateType.PENDING) {
        await sleep(200);
        continue;
      } else {
        break;
      }
    }

    if (this.#operationRequestId !== operationRequestId) {
      throw new Error("operationRequestId not match.");
    }

    if (this.#operationState === OperationStateType.ERROR) {
      throw new Error("operationState is ERROR.");
    }

    if (this.#operationState === OperationStateType.PENDING) {
      throw new Error("Connect wallet timeout.");
    }

    const publicKeyBytes = await decryptMessage(
      encryptKeyPair.privateKey,
      this.#operationResultPayload.publicKey
    );

    this.#publicKey = new PublicKey(publicKeyBytes);

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

  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }> {
    console.log("SolibraWallet sign message");
    const operationRequestId = uuidv4();
    const encryptKeyPair = await generateKeyPair();

    const exportedPublicKey = await exportPublicKey(encryptKeyPair.publicKey);

    this.startWaitOperation({ operationRequestId });

    await sendMsgToContentScript(
      SignMessageRequestCommandFactory.buildNew({
        from: CommandSource.INJECT_SCRIPT,
        signPayload: base64EncodeFromUint8Array(message),
        operationRequestId,
        operationRequestPublicKey: exportedPublicKey,
      })
    );

    for (let i = 0; i < 10000; i++) {
      if (this.#operationRequestId !== operationRequestId) {
        break;
      }

      if (this.#operationState === OperationStateType.PENDING) {
        await sleep(200);
        continue;
      } else {
        break;
      }
    }

    if (this.#operationRequestId !== operationRequestId) {
      throw new Error("operationRequestId not match.");
    }

    if (this.#operationState === OperationStateType.ERROR) {
      throw new Error("operationState is ERROR.");
    }

    if (this.#operationState === OperationStateType.PENDING) {
      throw new Error("Connect wallet timeout.");
    }

    const signature = await decryptMessage(
      encryptKeyPair.privateKey,
      this.#operationResultPayload.signature
    );

    return {
      signature,
    };
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
    this.#eventEmitter.emit("accountChanged");
  }

  async setPublicKey(publicKey: PublicKey | null) {
    this.#publicKey = publicKey;
  }

  startWaitOperation({ operationRequestId }: { operationRequestId: string }) {
    this.#operationRequestId = operationRequestId;
    this.#operationState = OperationStateType.PENDING;
    this.#operationResultPayload = {};
  }

  setOperationResult({
    operationRequestId,
    operationState,
    operationResultPayload,
  }: {
    operationRequestId: string;
    operationState: OperationStateType;
    operationResultPayload: Record<string, any>;
  }) {
    this.#operationRequestId = operationRequestId;
    this.#operationState = operationState;
    this.#operationResultPayload = operationResultPayload;
  }
}
