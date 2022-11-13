# Tiny demonstration self-upgrading smart contract on NEAR (with TypeScript)

## Overview

This repository was created to illustrate how we'd create a locked smart contract (thus preventing owner accounts from wantonly transferring from the contract's wallet) while maintaining the ability to update both the contract and the contract state.

It contains an `update_self` method which deploys new code into itself, and then runs a `clean_state` state migration function call. This is a toy demonstration, inspired by the NEAR team's Guestbook example for Rust.

To do this, I have written my own patch of the `initialize` macro, so that it accepts an `ignore_state` flag. This design, as hinted at before, is in keeping with the near-sdk-core (Rust's) design.

### How to run this project

1. First, clone it off github.
2. Make sure you have the `near` cli tool installed in your terminal. You can find it on [NPM](https://www.npmjs.com/package/near-cli) otherwise.
3. Run `yarn` to fetch the necessary dependencies.
4. Run `near login` to log in to your NEAR wallet.
5. To make the next stage easy, copy the account ID of the account you just logged into and add it to your environment variables with the key `NEAR_ID` (eg: my account ID is `godbrand.testnet` so I’ll execute `export NEAR_ID=godbrand.testnet).
6. Run `yarn demo:build && yarn demo:deploy` to build and deploy this contract to the testnet. If this runs successfully, you’ll get an explore URL to view the transaction.
7. Test that everything runs:
    1. Run `yarn demo:init` to initialize the contract's state. You'll get a log telling you your account ID is now the manager for this contract.
    2. Run `near call $NEAR_ID send_message '{"text": "maybe"}' --accountId $NEAR_ID --amount 0.05`. This is a payable function, and we pay 0.01 NEAR so our message can be marked ‘premium’ on the blockchain.
8. Because our account has `full account access` to this contract, we can hit the `transfer` method to transfer money from the contract to a wallet of our choosing. (This is the point of this demonstration).
To that: enter `near call $NEAR_ID transfer '{"to": "<DESTINATION_WALLET>", "amount": 50000000000000000000000000}' --accountId $NEAR_ID` into your terminal to see this in action. This will send 50 NEAR to the destination wallet.

At this point, we have everything we need to update this contract. To complete this:
1. Create a function call key on this contract (the only `method_name` you'll need here is `update_self`)
2. When you're done, you can delete the full-access key that was created when you created this account.
3. You should get an error now if you try to make another transfer, but
4. You will still be able to update the contract via the `update_self` method. 