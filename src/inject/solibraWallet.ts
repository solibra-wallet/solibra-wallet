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
import { ConnectRequestCommandFactory } from "../command/operationRequest/connectRequestCommand";
import { CommandSource } from "../command/base/baseCommandType";
import { EventEmitter } from "eventemitter3";
import { sleep } from "../common/sleep";
import { SignMessageRequestCommandFactory } from "../command/operationRequest/signMessageRequestCommand";
import { OperationStateType } from "../store/operationStore";
import {
  decryptMessage,
  exportPublicKey,
  generateKeyPair,
} from "../common/asymEncryptionUtils";
import { v4 as uuidv4 } from "uuid";
import { bytesToHex, hexToBytes } from "../common/encodingUtils";
import { OperationResponseCommandFactory } from "../command/operationResponseCommand";
import { SignAndSendTxRequestCommandFactory } from "../command/operationRequest/signAndSendTxRequestCommand";
import { SignTxRequestCommandFactory } from "../command/operationRequest/signTxRequestCommand";

export class SolibraWallet implements Solibra {
  #publicKey: PublicKey | null = null;
  #eventEmitter = new EventEmitter();

  #operationRequestId: string | null = null;
  #operationState: OperationStateType = OperationStateType.IDLE;
  #operationResultEncryptedPayload: string | null = null;

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
        requestId: operationRequestId,
        requestPublicKey: exportedPublicKey,
        site: window.location.origin,
      })
    );

    for (let i = 0; i < 1000; i++) {
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

    if (this.#operationResultEncryptedPayload === null) {
      throw new Error("operationResultEncryptedPayload is null.");
    }

    const operationResultPayload =
      await OperationResponseCommandFactory.defaultDecrypt(
        this.#operationResultEncryptedPayload,
        encryptKeyPair.privateKey
      );

    if (!operationResultPayload || !operationResultPayload.publicKey) {
      throw new Error("operationResultPayload corrupted.");
    }

    this.#publicKey = new PublicKey(operationResultPayload.publicKey as string);
    return {
      publicKey: operationResultPayload.publicKey,
    };
  }

  async disconnect(): Promise<void> {
    console.log("SolibraWallet disconnect");
    // throw new Error("Method not implemented.");
  }

  async signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions
  ): Promise<{ signature: TransactionSignature }> {
    console.log("SolibraWallet sign and send transaction");
    const operationRequestId = uuidv4();
    const encryptKeyPair = await generateKeyPair();

    const exportedPublicKey = await exportPublicKey(encryptKeyPair.publicKey);

    this.startWaitOperation({ operationRequestId });

    await sendMsgToContentScript(
      SignAndSendTxRequestCommandFactory.buildNew({
        from: CommandSource.INJECT_SCRIPT,
        encodedTransaction: bytesToHex(transaction.serialize()),
        sendOptions: options,
        requestId: operationRequestId,
        requestPublicKey: exportedPublicKey,
      })
    );

    for (let i = 0; i < 2000; i++) {
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
      throw new Error("operation timeout.");
    }

    if (this.#operationResultEncryptedPayload === null) {
      throw new Error("operationResultEncryptedPayload is null.");
    }

    const operationResultPayload =
      await OperationResponseCommandFactory.defaultDecrypt(
        this.#operationResultEncryptedPayload,
        encryptKeyPair.privateKey
      );

    if (
      !operationResultPayload ||
      !operationResultPayload.signature ||
      typeof operationResultPayload.signature !== "string"
    ) {
      throw new Error("operationResultPayload corrupted.");
    }
    const signature = operationResultPayload.signature;

    return {
      signature: signature,
    };
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    console.log("SolibraWallet sign transaction");
    const operationRequestId = uuidv4();
    const encryptKeyPair = await generateKeyPair();

    const exportedPublicKey = await exportPublicKey(encryptKeyPair.publicKey);

    this.startWaitOperation({ operationRequestId });

    await sendMsgToContentScript(
      SignTxRequestCommandFactory.buildNew({
        from: CommandSource.INJECT_SCRIPT,
        encodedTransaction: bytesToHex(transaction.serialize()),
        requestId: operationRequestId,
        requestPublicKey: exportedPublicKey,
      })
    );

    for (let i = 0; i < 2000; i++) {
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
      throw new Error("operation timeout.");
    }

    if (this.#operationResultEncryptedPayload === null) {
      throw new Error("operationResultEncryptedPayload is null.");
    }

    const operationResultPayload =
      await OperationResponseCommandFactory.defaultDecrypt(
        this.#operationResultEncryptedPayload,
        encryptKeyPair.privateKey
      );

    if (
      !operationResultPayload ||
      !operationResultPayload.encodedSignedTransaction ||
      typeof operationResultPayload.encodedSignedTransaction !== "string"
    ) {
      throw new Error("operationResultPayload corrupted.");
    }

    try {
      const signedTransaction = hexToBytes(
        operationResultPayload.encodedSignedTransaction
      );
      try {
        return VersionedTransaction.deserialize(signedTransaction) as T;
      } catch (e) {
        return Transaction.from(signedTransaction) as T;
      }
    } catch (e) {
      throw new Error("Cannot deserialize signed transaction.");
    }
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
        signPayload: bytesToHex(message),
        requestId: operationRequestId,
        requestPublicKey: exportedPublicKey,
      })
    );

    for (let i = 0; i < 2000; i++) {
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
      throw new Error("operation timeout.");
    }

    if (this.#operationResultEncryptedPayload === null) {
      throw new Error("operationResultEncryptedPayload is null.");
    }

    const operationResultPayload =
      await OperationResponseCommandFactory.defaultDecrypt(
        this.#operationResultEncryptedPayload,
        encryptKeyPair.privateKey
      );

    if (
      !operationResultPayload ||
      !operationResultPayload.signature ||
      typeof operationResultPayload.signature !== "string"
    ) {
      throw new Error("operationResultPayload corrupted.");
    }
    const signature = hexToBytes(operationResultPayload.signature);

    return {
      signature: signature,
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
    this.#operationResultEncryptedPayload = null;
  }

  setOperationResult({
    requestId,
    operationState,
    resultEncryptedPayload,
  }: {
    requestId: string;
    operationState: OperationStateType;
    resultEncryptedPayload: string;
  }) {
    this.#operationRequestId = requestId;
    this.#operationState = operationState;
    this.#operationResultEncryptedPayload = resultEncryptedPayload;
  }
}
