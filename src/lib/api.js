import {
  WarpFactory,
  LoggerFactory,
} from 'warp-contracts';
import { selectWeightedPstHolder } from 'smartweave';
import { mul, pow } from './math';
import { intelliContract } from './intelliContract';

LoggerFactory.INST.logLevel('error');

// addresses
const wrc20MainnetSrcTx = 'jxB_n6cJo4s-a66oMIGACUjERJXQfc3IoIMV3_QK-1w';
const atomnftMainnetSrcTx = 'FIQiquxFLCz3uA_XVGp-qHxVw6A9d-FalNZa1Flzqos';
const collectibleMainnetSrcTx = 'ZvADh0sK2jZEUYxwRMQ8hcCuvRi2meejdzKiBFYisgU';

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
  if (await minARBalanceCheck('0.01') === false) {
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
    result = 'Fail to deploy contract!';
  }
  if (status === false) {
    return {status: status, result: result};
  }

  return {status: status, result: 'Token contract deployed!', txID: `${result.contractTxId}`};
}

export async function deployAtomicNFT(form, collectibleAddress) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (await minARBalanceCheck('0.01') === false) {
    return {status: false, result: 'You should have at least 0.01$AR in wallet to pay for network fee!'};
  }
  const supply = parseInt(form.supply);
  if (isNaN(supply) || !isFinite(supply) || supply <= 0) {
    return {status: false, result: 'MaxSupply should be a positive integer!'};
  }

  const initialState = {
    description: form.description,
    symbol: form.symbol,
    name: form.name,
    decimals: 0,
    totalSupply: supply,
    balances: {
      [walletAddress]: supply,
    },
    allowances: {}
  };

  let status = true;
  let result = '';

  try {
    const tx = await warp.createContract.deployFromSourceTx({
      wallet: 'use_wallet',
      srcTxId: atomnftMainnetSrcTx,
      initState: JSON.stringify(initialState),
      data: { 'Content-Type': form.asset.type, body: form.asset.data },
      tags: [{
        name: 'collectible',
        value: collectibleAddress
      }]
    }, true);
    if (isWellFormattedAddress(tx.contractTxId)) {
      status = true;
      result = tx.contractTxId;
    } else {
      status = false;
      result = 'Fail to deploy Atomic-nft!'
    }
  } catch (err) {
    status = false;
    result = err;
  }

  return {status, result};
}

export async function deployCollectible(form) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (await minARBalanceCheck('0.01') === false) {
    return {status: false, result: 'You should have at least 0.01$AR in your wallet to pay for network fee!'};
  }

  let result = "";
  let status = true;
  try {
    result = (await warp.createContract.deployFromSourceTx({
      wallet: 'use_wallet',
      srcTxId: collectibleMainnetSrcTx,
      initState: JSON.stringify({owner: getWalletAddress(), nftSet: {}, name: form.name, description: form.description}),
    })).contractTxId;
  } catch {
    status = false;
    result = 'Fail to deploy contract!';
  }

  return {status, result};
}

export async function addToCollectible(collectibleAddress, nftAddress) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }

  let status = true;
  let result = '';
  try {
    const collectible = new intelliContract(warp);
    collectible.connectContract(collectibleAddress);
    collectible.connectWallet('use_wallet');

    await collectible.writeInteraction({
      function: 'mint',
      params: {
        nftAddress: nftAddress
      }
    });

    status = true;
    result = 'Success!';
  } catch (err) {
    status = false;
    result = 'Fail to add NFTs to collectible!';
  }

  return {status, result};
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
  return arweave.ar.winstonToAr(
    arweave.ar.add(
      arweave.ar.arToWinston(a), 
      arweave.ar.arToWinston(b)
    )
  );
}

export function arLessThan(a, b) {
  return arweave.ar.isLessThan(arweave.ar.arToWinston(a), arweave.ar.arToWinston(b));
}

export async function getFeeEstimation(fileStream) {
  const tmpKey = await arweave.wallets.generate();
  let tx = await arweave.createTransaction(
    { data: fileStream }, 
    tmpKey
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
      const token = new intelliContract(warp);
      token.connectContract(tokenAddress);
      result = await (await token.viewState({
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

export async function checkConfirmation(txID) {
  const txRet = await arweave.transactions.getStatus(txID);
  if (txRet.status !== 200) {
    return {status: false, result: 'Please wait for NFT to be mined by Arweave and retry!'};
  }
  const confirmations = txRet.confirmed.number_of_confirmations;
  if (confirmations === undefined || confirmations < 10) {
    return {status: false, result: `Please wait for network confirmation: ${confirmations} / 10`};
  }

  return {status: true, result: 'Confirmed by network!'};
}