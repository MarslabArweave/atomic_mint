import {
  WarpFactory,
  LoggerFactory,
} from 'warp-contracts';
import { selectWeightedPstHolder } from 'smartweave';
import { mul, pow } from './math';
import { intelliContract } from './intelliContract';

LoggerFactory.INST.logLevel('error');

// addresses
const atomicAssetSrcTx = 'I6GgRnDWR34PQI_wiN6vYYxrgnbeetgkbyI0Zo0S21Q';
const collectionMainnetSrcTx = 'cqIysttz_FXK6In_kP_LhwXOgTYN6zm5WoRTYoVKw4c';

// const warp = WarpFactory.forLocal(1984);
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
      srcTxId: atomicAssetSrcTx,
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

export async function uploadLogo(logo) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  console.log('upload logo: ', logo);
  const imgStream = await (await fetch(URL.createObjectURL(logo))).arrayBuffer();
  const imgType = logo.type;

  let tx = await arweave.createTransaction(
    { data: imgStream }, 
    'use_wallet'
  );
  tx.addTag('Content-Type', imgType);

  await arweave.transactions.sign(tx, 'use_wallet');

  let uploader = await arweave.transactions.getUploader(tx);
  while (!uploader.isComplete) {
    await uploader.uploadChunk();
    console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
  }

  return tx.id;
}

export async function deployAtomicNFT(form, collectionAddress) {
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
    collection: collectionAddress,
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
      srcTxId: atomicAssetSrcTx,
      initState: JSON.stringify(initialState),
      data: { 'Content-Type': form.asset.type, body: form.asset.data },
      tags: [
        {
          name: 'Indexed-By',
          value: 'atomic-asset'
        }
      ]
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

export async function deployCollection(form, attributes) {
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
      srcTxId: collectionMainnetSrcTx,
      initState: JSON.stringify({owner: getWalletAddress(), nftSet: {}, name: form.name, description: form.description, attributes: attributes}),
    })).contractTxId;
  } catch {
    status = false;
    result = 'Fail to deploy contract!';
  }

  return {status, result};
}

export async function addToCollection(collectionAddress, nftAddress, attributes) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }

  let status = true;
  let result = '';
  try {
    const collection = new intelliContract(warp);
    collection.connectContract(collectionAddress);
    collection.connectWallet('use_wallet');

    await collection.writeInteraction({
      function: 'mint',
      params: {
        nftAddress: nftAddress,
        attributes: attributes
      }
    });

    status = true;
    result = 'Success!';
  } catch (err) {
    status = false;
    result = 'Fail to add NFTs to collection!';
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