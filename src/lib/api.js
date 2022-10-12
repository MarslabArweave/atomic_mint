import mintableSrc from './mintable.txt';
import fixedSupplySrc from './fixed_supply.txt';

import {
  WarpFactory,
  LoggerFactory,
} from 'warp-contracts';
import { selectWeightedPstHolder } from 'smartweave';
/* global BigInt */

LoggerFactory.INST.logLevel('error');

// const warp = WarpFactory.forTestnet();
const warp = WarpFactory.forMainnet();
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

export async function deployPst(initialState, donation) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (initialState.type !== 'mintable' && initialState.type !== 'fixed_supply') {
    return {status: false, result: 'PST type error!'};
  }
  if (!Number.isInteger(initialState.maxSupply)) {
    return {status: false, result: 'MaxSupply must be integer!'};
  }
  if (initialState.maxSupply < 0) {
    return {status: false, result: 'MaxSupply should be a positive number!'};
  }
  if (initialState.type === 'mintable') {
    if (typeof(initialState.mintPrice) !== 'number') {
      return {status: false, result: 'MintPrice must be number!'};
    }
    if (!Number.isInteger(initialState.mintable)) {
      return {status: false, result: 'Mintable must be integer!'};
    }
    if (initialState.mintable < 0) {
      return {status: false, result: 'Initial supply should less than maxSupply!'};
    }
  }
  
  const pstSrcFromFile = await fetch(initialState.type === 'mintable' ? mintableSrc : fixedSupplySrc);
  const pstSrc = await pstSrcFromFile.text();

  let result = "";
  let status = true;
  try {
    result = await warp.createContract.deploy({
      wallet: 'use_wallet',
      initState: JSON.stringify(initialState),
      src: pstSrc,
    },
    true);
  } catch {
    status = false;
    result = 'Deploy contract failed!';
  }
  if (status === false) {
    return {status: status, result: result};
  }

  // distribute fee to pst holder
  const balances = (await warp.pst('SFHFAaksR6MBzodpTbeXhDdin5hIUuqe1o4YMFoQdK0').readState())
      .cachedValue.state['balances'];
  const transaction = await arweave.createTransaction({
    target: selectWeightedPstHolder(balances),
    quantity: arweave.ar.arToWinston(donation)
  }, 'use_wallet');
  console.log(transaction);
  await arweave.transactions.sign(transaction, 'use_wallet');
  await arweave.transactions.post(transaction);

  return {status: status, result: `Success! Please write down PST address: ${result.contractTxId}`};
}

export const isWellFormattedAddress = (input) => {
  const re = /^[a-zA-Z0-9_-]{43}$/;
  return re.test(input);
}