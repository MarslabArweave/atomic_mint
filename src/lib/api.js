import {
  WarpFactory,
  LoggerFactory,
} from 'warp-contracts';
import { selectWeightedPstHolder } from 'smartweave';
/* global BigInt */

const mainnetTx = 'jxB_n6cJo4s-a66oMIGACUjERJXQfc3IoIMV3_QK-1w';
const testnetTx = 'DOtSGUejas8HMF7NnaOEwlnywZEO5FVjCTRRoiqyEqA';
const localTx = 'LzY7IezFA3-prf9L1SY7Lk6DkSDJOF4Y7G0hx6XB0rA';

LoggerFactory.INST.logLevel('error');

// const warp = WarpFactory.forLocal(1984);
// const warp = WarpFactory.forTestnet();
const warp = WarpFactory.forMainnet();
const srcTxId = mainnetTx;

const arweave = warp.arweave;
let walletAddress = undefined;
let isConnectWallet = false;

export async function connectWallet(walletJwk) {
  walletAddress = await arweave.wallets.jwkToAddress(walletJwk);
  isConnectWallet = true;
}

export function getWalletAddress() {
  return walletAddress;
}

export function arLessThan(a, b) {
  return arweave.ar.isLessThan(arweave.ar.arToWinston(a), arweave.ar.arToWinston(b));
}

export async function deployPst(initialState, donation) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  const arBalance = await arweave.wallets.getBalance(walletAddress);
  if (arLessThan(arweave.ar.winstonToAr(arBalance), '0.02')) {
    return {status: false, result: 'You should hold at least 0.02$AR in your wallet to pay for network fee!'};
  }

  let result = "";
  let status = true;
  try {
    result = (await warp.createContract.deployFromSourceTx({
      wallet: 'use_wallet',
      srcTxId: srcTxId,
      initState: JSON.stringify(initialState),
    }, true));
  } catch {
    status = false;
    result = 'Deploy contract failed!';
  }
  if (status === false) {
    return {status: status, result: result};
  }

  // distribute fee to pst holder
  try {
    const balances = (await warp.pst('SFHFAaksR6MBzodpTbeXhDdin5hIUuqe1o4YMFoQdK0').readState())
        .cachedValue.state['balances'];
    const transaction = await arweave.createTransaction({
      target: selectWeightedPstHolder(balances),
      quantity: arweave.ar.arToWinston(donation)
    }, 'use_wallet');
    console.log(transaction);
    await arweave.transactions.sign(transaction, 'use_wallet');
    await arweave.transactions.post(transaction);
  } catch {}

  return {status: status, result: `Success! Please write down WRC-20 token address: ${result.contractTxId}`};
}

export const isWellFormattedAddress = (input) => {
  const re = /^[a-zA-Z0-9_-]{43}$/;
  return re.test(input);
}