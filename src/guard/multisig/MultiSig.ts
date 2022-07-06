import * as wasm from 'ergo-lib-wasm-nodejs';
import {
    ApprovePayload, CommitmentJson,
    CommitmentPayload,
    CommunicationMessage,
    RegisterPayload,
    Signer, SignPayload,
    TxQueued
} from "./Interfaces";
import { sign, verify } from "./Enc";
import * as crypto from "crypto";
import Dialer from "../../communication/Dialer";
import Configs from "../../helpers/Configs";
import { Semaphore } from 'await-semaphore';
import { add_hints, convertToHintBag, extract_hints } from "./utils";

const dialer = await Dialer.getInstance();

class MultiSigHandler {
    private static CHANNEL = "multi-sig"
    private readonly transactions: Map<string, TxQueued>
    private readonly peers: Array<Signer>;
    private prover?: wasm.Wallet;
    private index?: number;
    private peerId?: string;
    private semaphore = new Semaphore(1);

    constructor(publicKeys: Array<string>) {
        this.transactions = new Map<string, TxQueued>();
        this.peers = publicKeys.map(item => ({
            pub: item,
            unapproved: [],
        }));
        dialer.subscribeChannel(MultiSigHandler.CHANNEL, this.handleMessage);
    }

    private getIndex = (): number => {
        if (!this.index) {
            const ergoTree = wasm.SecretKey.dlog_from_bytes(Configs.secret).get_address().to_ergo_tree().to_base16_bytes();
            const publicKey = ergoTree.substring(ergoTree.length - 66);
            this.index = this.peers.map((peer, index) => [peer.pub, index]).filter(row => row[0] === publicKey)[0][1] as number
        }
        if (this.index)
            return this.index;
        throw Error("My index not found in guard public keys")
    }

    public sign = (tx: wasm.ReducedTransaction, boxes: Array<wasm.ErgoBox>, dataBoxes?: Array<wasm.ErgoBox>) => {
        return new Promise<wasm.Transaction>((resolve, reject) => {
            this.getQueuedTransaction(tx.unsigned_tx().id().to_str()).then(transaction => {
                transaction.tx = tx;
                transaction.boxes = boxes;
                transaction.dataBoxes = dataBoxes ? dataBoxes : [];
                transaction.resolve = resolve;
                transaction.reject = reject;
                this.generateCommitment(tx.unsigned_tx().id().to_str())
            }).catch((e) => {
                reject(e)
            })
        })
    }

    private getPeerId = (): string => {
        const peerId = dialer.getPeerId();
        if (this.peerId !== peerId) {
            // TODO must call all other guards to update peerId
        }
        return peerId;
    }

    private cleanup = () => {
        this.semaphore.acquire().then(release => {
            const toRemoveKeys: Array<string> = []
            for (const [key, transaction] of this.transactions.entries()) {
                if (transaction.createTime < new Date().getTime() - Configs.multiSigTimeout) {
                    toRemoveKeys.push(key)
                }
            }
            toRemoveKeys.forEach(key => this.transactions.delete(key))
            release()
        })
    }

    private getProver = (): wasm.Wallet => {
        if (!this.prover) {
            const secret = wasm.SecretKey.dlog_from_bytes(Configs.secret)
            const secretKeys = new wasm.SecretKeys();
            secretKeys.add(secret)
            this.prover = wasm.Wallet.from_secrets(secretKeys)
        }
        if (this.prover)
            return this.prover;
        throw Error("Can not create prover")
    }

    generateCommitment = (id: string) => {
        const queued = this.transactions.get(id)
        wasm.ErgoBox.sigma_parse_bytes(Uint8Array.from(Buffer.from(""))).register_value(4)?.to_coll_coll_byte()
        if (queued && this.prover && !queued.secret && queued.tx) {
            queued.secret = this.getProver().generate_commitments_for_reduced_transaction(queued.tx)
            // publish commitment
            const commitmentJson: CommitmentJson = queued.secret.to_json() as CommitmentJson;
            const publicHints = commitmentJson.publicHints
            const publishCommitments: { [index: string]: { a: string; position: string } } = {}
            Object.keys(publicHints).forEach(inputIndex => {
                const inputHints = publicHints[inputIndex].filter(item => !item.secret);
                if (inputHints) {
                    publishCommitments[inputIndex] = {"a": inputHints[0].a, position: inputHints[0].position}
                }
            })
            this.sendMessage({
                type: "commitment",
                payload: {
                    txId: id,
                    commitment: publishCommitments
                }
            }, this.peers.map(item => item.id ? item.id : "").filter(item => item !== ""))
        }
    }

    generateSign = (id: string) => {
        const prover = this.getProver();
        this.getQueuedTransaction(id).then(async (transaction) => {
            if (transaction.tx && transaction.secret) {
                const myPub = this.peers[this.getIndex()].pub
                let signed: Array<string> = [];
                let simulated: Array<string> = [];
                let hints: wasm.TransactionHintsBag = wasm.TransactionHintsBag.empty();
                if (transaction.sign) {
                    simulated = transaction.sign.simulated;
                    signed = transaction.sign.signed;
                    if (signed.indexOf(myPub) === -1) {
                        hints = await extract_hints(
                            transaction.sign.transaction,
                            transaction.boxes,
                            transaction.dataBoxes,
                            signed,
                            simulated
                        )
                    }
                } else {
                    simulated = transaction.commitments.map((item, index) => {
                        if (item !== undefined) {
                            return this.peers[index].pub
                        }
                        return ""
                    }).filter(item => !!item)
                    signed = [myPub]
                }
                add_hints(hints, transaction.secret, transaction.tx)
                for (let index = 0; index < transaction.commitments.length; index++) {
                    const commitment = transaction.commitments[index];
                    if (commitment && this.peers.length > index) {
                        const peer = this.peers[index];
                        if (signed.indexOf(this.peers[index].pub) === -1) {
                            const publicHints = convertToHintBag(commitment, peer.pub)
                            add_hints(hints, publicHints, transaction.tx)
                        }
                    }
                }
                const signedTx = prover.sign_reduced_transaction_multi(transaction.tx, transaction.secret)
                const tx = Buffer.from(signedTx.sigma_serialize_bytes()).toString("base64")
                // broadcast signed invalid transaction to all other
                const payload: SignPayload = {
                    tx: tx,
                    txId: signedTx.id().to_str(),
                    signed: signed,
                    simulated: simulated
                }
                const peers = this.peers.map(item => item.id ? item.id : "").filter(item => {
                    return item !== "" && simulated.indexOf(item) === -1 && signed.indexOf(item) === -1
                })
                if (peers.length > 0) {
                    this.sendMessage({type: "sign", payload: payload}, peers)
                } else {
                    if (transaction.resolve) {
                        transaction.resolve(signedTx)
                    }
                }
            }
        })
    }

    sendMessage = (message: CommunicationMessage, receivers?: Array<string>) => {
        const payload = message.payload;
        payload.index = this.getIndex();
        payload.id = this.getPeerId();
        const payloadStr = JSON.stringify(message.payload)
        message.sign = sign(payloadStr, Buffer.from(Configs.secret)).toString("base64");
        if (receivers) {
            receivers.map(receiver => dialer.sendMessage(MultiSigHandler.CHANNEL, message, receiver).then(() => null))
        } else {
            dialer.sendMessage(MultiSigHandler.CHANNEL, message).then(() => null)
        }
    }

    handleRegister = (sender: string, payload: RegisterPayload) => {
        if (payload.index) {
            const peer = this.peers[payload.index];
            const nonce = crypto.randomBytes(32).toString("base64");
            peer.unapproved.push({id: sender, challenge: nonce})
            this.sendMessage({
                type: "approve",
                sign: "",
                payload: {
                    nonce: payload.nonce,
                    nonceToSign: nonce
                }
            })
        }
    }

    handleApprove = (sender: string, payload: ApprovePayload) => {
        if (payload.index) {
            const nonce = payload.nonce;
            const peer = this.peers[payload.index];
            const unapproved = peer.unapproved.filter(item => item.id === sender && item.challenge === nonce)
            if (unapproved.length > 0) {
                peer.id = sender;
                peer.unapproved = peer.unapproved.filter(item => unapproved.indexOf(item) === -1)
            }
        }
    }

    getQueuedTransaction = (txId: string): Promise<TxQueued> => {
        return this.semaphore.acquire().then(release => {
            const transaction = this.transactions.get(txId);
            if (transaction) {
                release()
                return transaction
            }
            const newTransaction: TxQueued = {
                boxes: [],
                dataBoxes: [],
                commitments: this.peers.map(() => undefined),
                createTime: new Date().getTime()
            }
            this.transactions.set(txId, newTransaction);
            release()
            return newTransaction;
        })
    }

    handleCommitment = (sender: string, payload: CommitmentPayload) => {
        if (payload.index && payload.txId) {
            const index = payload.index
            this.getQueuedTransaction(payload.txId).then(transaction => transaction.commitments[index] = payload.commitment)
        }
    }

    handleSign = (sender: string, payload: SignPayload) => {
        if (payload.txId) {
            this.getQueuedTransaction(payload.txId).then(transaction => {
                const myPub = this.peers[this.getIndex()].pub
                let updateSign = true;
                if(transaction.sign) {
                    if(payload.signed.filter(item => item !== myPub).length <= transaction.sign.signed.filter(item => item !== myPub).length){
                        updateSign = false
                    }
                }
                if(updateSign){
                    // no signed data. we store this data
                    transaction.sign = {
                        signed: payload.signed,
                        simulated: payload.simulated,
                        transaction: wasm.Transaction.sigma_parse_bytes(Uint8Array.from(Buffer.from(payload.tx)))
                    }
                }
                if(transaction.sign?.signed.indexOf(myPub) === -1){
                    this.generateSign(payload.txId)
                }
            })
        }
    }

    handleMessage = (messageStr: string, channel: string, sender: string) => {
        const message = JSON.parse(messageStr) as CommunicationMessage;
        if (message.payload.index && message.payload.id && message.sign) {
            if (sender !== message.payload.id) {
                return
            }
            const index = message.payload.index;
            const publicKey = Buffer.from(this.peers[index].pub, "hex");
            const signature = Buffer.from(message.sign, "hex");
            // verify signature
            const payloadStr = JSON.stringify(message.payload);
            if (verify(payloadStr, signature, publicKey)) {
                switch (message.type) {
                    case "register":
                        this.handleRegister(sender, message.payload as RegisterPayload)
                        break;
                    case "approve":
                        this.handleApprove(sender, message.payload as ApprovePayload)
                        break;
                    case "commitment":
                        this.handleCommitment(sender, message.payload as CommitmentPayload)
                        break
                    case "sign":
                        this.handleSign(sender, message.payload as SignPayload)
                        break
                }
            }
        }
    }
}

// const MultiSig = new MultiSigHandler();

export {
    MultiSigHandler
}