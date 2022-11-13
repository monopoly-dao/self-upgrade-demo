// @ts-nocheck
import { NearBindgen, view, near, initialize, call, NearPromise, assert, Vector, bytes } from 'near-sdk-js'
import { AccountId, Balance, Gas } from 'near-sdk-js/lib/types'
import { includeBytes } from 'near-sdk-js';

type Messages = {
    premium: boolean,
    sender: AccountId,
    message: string,
}

const NO_ARGS = bytes(JSON.stringify({}));
const FIVE_TGAS = BigInt("50000000000000");
const NO_DEPOSIT = BigInt(0);

@NearBindgen({})
export class SankoreTypescriptDemo {
    messages: Vector
    payments: Vector
    manager: AccountId
    base_gas: string
    manager: AccountId

    constructor() {
        this.base_gas = '10000000000000000000000';
        this.messages = new Vector('messages');
        this.payments = new Vector('payments');
        this.manager = ''
    }

    @initialize({ privateFunction: true})
    init() {
        this.manager = near.signerAccountId();
        near.log(`EVENT_LOG:{"message": "state initialized!", "contractManager": ${this.manager}}`);
    }


    @call({payableFunction: true})
    send_message({text}: {
        text: string
    }): void {
        const payment = near.attachedDeposit();
        near.log(`${this.base_gas} — ${payment}`)
        const premium = payment >= BigInt(parseInt(this.base_gas));
        const sender = near.predecessorAccountId()

        const new_message: Messages = {
            message: text,
            premium,
            sender
        }

        this.messages.push(new_message)
        this.payments.push(payment.toLocaleString('fullwide', {useGrouping:false}))

        near.log(`EVENT_LOG: ${sender} added message ${text} to contract and paid ${payment} gas!`)

        return this.payments;
    }


    @view({})
    get_messages(): Vector | string {
        if (this.messages.isEmpty()) return 'No messages submitted yet'
        return this.messages.toArray();
    }

    @view({})
    get_manager(): AccountId {
        return this.manager;
    }

    @view({})
    get_messages_for_sender({senderId}: {senderId: AccountId}): Messages {
        const messagesForSender = this.messages.toArray()
            .filter((message: Messages) => {
                message.sender === senderId
            })

        return messagesForSender;
    }

    @view({})
    get_contract_balance(): Balance {
        return near.accountBalance().toString();
    }

    @view({})
    get_payments(): Vector {
        if (this.payments.isEmpty()) return 'No payments yet!'
        return this.payments;
    }
    
    @call({})
    transfer({ to, amount }: { to: AccountId, amount: number }): NearPromise | string {
        if (to && amount) {
            return NearPromise.new(to).transfer(BigInt(amount))
        }

        return 'Amount and/or Destination account missing!'
  }

  @initialize({ignoreState: true})
  clean_state(): string {
    const old_messages = this.messages;
    const old_payments = this.payments;

    const new_messages = new Vector('new_messages');

    for (let i = 0; i <= old_messages.length; i++) {
        const message: Messages = {
            ...old_messages.get(i),
            payments: old_payments.get(i)
        }
        new_messages.push(message);
    }

        this.messages = new_messages;

        return JSON.stringify(this.messages);
  }

  @call({})
  upgrade_self(): NearPromise {
    assert(near.predecessorAccountId() === this.manager, "Only the manager can update this contract!");

    const promise = NearPromise.new(near.currentAccountId())
    promise.deployContract(includeBytes('../../build/guestbook.wasm'))
        .functionCall(
                "clean_state",
                NO_ARGS,
                NO_DEPOSIT,
                FIVE_TGAS
        )

    return promise.asReturn();
  }
}