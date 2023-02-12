import {
  WarpFactory,
  LoggerFactory,
} from 'warp-contracts';
import { selectWeightedPstHolder } from 'smartweave';
import { mul, pow } from './math';
import { intelliContract } from './intelliContract';
import { stat } from 'fs';

LoggerFactory.INST.logLevel('error');

// addresses
const wrc20MainnetSrcTx = 'jxB_n6cJo4s-a66oMIGACUjERJXQfc3IoIMV3_QK-1w';
const atomnftMainnetSrcTx = 'FIQiquxFLCz3uA_XVGp-qHxVw6A9d-FalNZa1Flzqos';
const wmintTokenAddress = 'SFHFAaksR6MBzodpTbeXhDdin5hIUuqe1o4YMFoQdK0';

// const warp = WarpFactory.forLocal(1984);
// const warp = WarpFactory.forTestnet();
const warp = WarpFactory.forMainnet({
  dbLocation: './cache/warp'+(new Date().getTime()).toString(), 
  inMemory: false
});
const arweave = warp.arweave;
let walletAddress = undefined;
export let isConnectWallet = false;

export async function deployToken(initialState) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!minARBalanceCheck('0.01')) {
    return {status: false, result: 'You should have at least 0.01$AR in your wallet to pay for network fee!'};
  }

  let result = "";
  let status = true;
  try {
    result = (await warp.createContract.deployFromSourceTx({
      wallet: 'use_wallet',
      srcTxId: wrc20MainnetSrcTx,
      initState: JSON.stringify(initialState),
    }, true));
  } catch {
    status = false;
    result = 'Deploy contract failed!';
  }
  if (status === false) {
    return {status: status, result: result};
  }

  return {status: status, result: 'Token contract deployed!', txID: `${result.contractTxId}`};
}

export async function deployAtomicNFT(initialState, data, donation) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  const arBalance = await arweave.wallets.getBalance(walletAddress);
  // if (arLessThan(arweave.ar.winstonToAr(arBalance), '0.02')) {
  //   return {status: false, result: 'You should hold at least 0.02$AR in your wallet to pay for network fee!'};
  // }

  let result = "";
  let status = true;
  try {
    result = (await warp.createContract.deployFromSourceTx({
      wallet: 'use_wallet',
      srcTxId: atomnftMainnetSrcTx,
      initState: JSON.stringify(initialState),
      data: data
    }, true));
  } catch {
    status = false;
    result = 'Deploy contract failed!';
  }
  if (status === false) {
    return {status: status, result: result};
  }

  // distribute fee to pst holder
  // try {
  //   const balances = (await warp.pst('SFHFAaksR6MBzodpTbeXhDdin5hIUuqe1o4YMFoQdK0').readState())
  //       .cachedValue.state['balances'];
  //   const transaction = await arweave.createTransaction({
  //     target: selectWeightedPstHolder(balances),
  //     quantity: arweave.ar.arToWinston(donation)
  //   }, 'use_wallet');
  //   console.log(transaction);
  //   await arweave.transactions.sign(transaction, 'use_wallet');
  //   await arweave.transactions.post(transaction);
  // } catch {}

  return {status: status, result: `Success! Please write down atomicNFT address: ${result.contractTxId}`};
}

// common api

export async function connectWallet(walletJwk) {
  isConnectWallet = true;
  walletAddress = await arweave.wallets.jwkToAddress(walletJwk);
}

export function getWalletAddress() {
  return walletAddress;
}

async function minARBalanceCheck(threshInAR) {
  const arBalanceRet = await getBalance('ar');
  if (arBalanceRet.status && arLessThan(arBalanceRet.result, threshInAR)) {
    return false;
  }
  return true;
}

export function arAdd(a, b) {
  return arweave.ar.add(arweave.ar.arToWinston(a), arweave.ar.arToWinston(b));
}

export function arLessThan(a, b) {
  return arweave.ar.isLessThan(arweave.ar.arToWinston(a), arweave.ar.arToWinston(b));
}

export async function getFeeEstimation(fileStream) {
  let tx = await arweave.createTransaction(
    { data: fileStream }, 
    'use_wallet'
  );
  return arweave.ar.winstonToAr(tx.reward);
}

export const isWellFormattedAddress = (input) => {
  const re = /^[a-zA-Z0-9_-]{43}$/;
  return re.test(input);
}

export const getContractTxInfo = async (contractAddress) => {
  let tx = await arweave.transactions.get(contractAddress);
  tx.owner_address = await arweave.wallets.ownerToAddress(tx.owner);
  return {status: true, result: tx};
};

export const getDateByTx = async (txId) => {
  const txRet = await arweave.transactions.getStatus(txId);
  if (txRet.status !== 200) {
    return {status: false, result: 'Cannot find specific TxID on Arweave Network!'};
  }
  const blockHeight = txRet.confirmed.block_height;
  var elapsed = (await arweave.blocks.getCurrent()).height - blockHeight;
  const date = new Date();
  date.setMinutes(date.getMinutes() - elapsed * 2);
  return {status: true, result: date.toLocaleDateString()};
};

export const getContractData = async (contractAddress) => {
  const data = await arweave.transactions.getData(contractAddress, {decode: true, string: true});
  return {status: true, result: data};
};

export async function getBalance(tokenAddress) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }

  if (!isWellFormattedAddress(tokenAddress) && tokenAddress !== 'ar') {
    return {status: false, result: 'Pst address not valid!'};
  }

  let result = "";
  let status = true;
  try {
    if (tokenAddress === 'ar') {
      result = arweave.ar.winstonToAr(await arweave.wallets.getBalance(getWalletAddress()));
    } else {
      result = await (await warp.contract(tokenAddress).viewState({
        function: 'balanceOf',
        target: getWalletAddress(),
      })).result.balance;
    }
  } catch (error) {
    status = false;
    result = error.message;
  }

  return {status: status, result: result};
}