import React from "react";
import { connectWallet, deployAtomicNFT, getWalletAddress, getFeeEstimation, arAdd } from "../lib/api";
import { FileUploader } from "./FileUploader/FileUploader";
import { Selector } from "./Selector/Selector";
import { SubmitButton } from "./SubmitButton/SubmitButton";
import { TextInput } from "./TextInput/TextInput";
import { WalletSelectButton } from "./WalletSelectButton/WalletSelectButton";

export const MintNFT = (props) => {
  const [walletConnected, setWalletConnected] = React.useState(false);
  const [disabled, setDisabled] = React.useState(false);
  const [nftName, setNFTName] = React.useState("");
  const [symbol, setSymbol] = React.useState("");
  const [maxSupply, setMaxSupply] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [data, setData] = React.useState();
  const [estFee, setEstFee] = React.useState();
  const [donate, setDonate] = React.useState("0.1");

  React.useEffect(async () => {
    if (walletConnected) {
      connectWallet('use_wallet');
    }
  }, [walletConnected]);

  React.useEffect(async () => {
    if (nftName !== '' && symbol !== '' && maxSupply !== '' && donate !== '') {
        setDisabled(false);
        return;
    } else {
      setDisabled(true);
    }
  }, [nftName, symbol, maxSupply, donate, data]);

  React.useEffect(async () => {
    if (data && walletConnected) {
      const imgStream = await (await fetch(URL.createObjectURL(data))).arrayBuffer();
      const fee = await getFeeEstimation(imgStream);
      setEstFee(fee);
    }
  }, [data, walletConnected]);

  async function onSubmit() {
    // if ((arAdd(donate, estFee), getBalance))
    if (!Number.isInteger(Number(maxSupply))) {
      return {status: false, result: 'Max supply should be integer!'};
    }
    const dataStream = await (await fetch(URL.createObjectURL(data))).arrayBuffer();
    const dataType = data.type === '' ? 'Unknown' : data.type;

    const initState = {
      description: description,
      symbol: symbol,
      name: nftName,
      decimals: 0,
      totalSupply: maxSupply,
      balances: {
        [getWalletAddress()]: maxSupply,
      },
      allowances: {},
      owner: getWalletAddress()
    };
    console.log('nft init state: ', initState);
    return await deployAtomicNFT(initState, {'Content-Type': dataType, body: dataStream}, donate);
  }

  return (<>
    <div className='textBlock'>
      <div className='textMidiumKey'>Create standard WRC atomicNFT on Arweave</div>
    </div>
    <div className='textBlock'>
    <div className='textSmallValue'><a href='https://github.com/warp-contracts/wrc'>WRC-20</a> is a token standard recommended by the Warp Contract team. It is written in RUST language and has undergone a complete security audit.</div>
      <div className='textSmallValue'>By using WeaveMint, you can easily deploy standard WRC-20 token on Arweave chain with several clicks.</div>
      <div className='textSmallValue'>No coding skills are required.</div>
      <div className='textSmallValue'>After deployed, you can find your token infos and make transactions <a href='https://arweave.net/_tfx0j4nhCwRDYmgU6XryFDceF52ncPKVivot5ijwdQ'><b>HERE</b></a>.</div>
    </div>
    <TextInput 
      title='NFT name:'
      tip='Choose a name for your NFT.'
      onChange={setNFTName}
      placeholder='e.g. Game Loot'
    />
    <TextInput 
      title='Symbol:'
      tip='Choose a symbol for your NFT (usually 2-5 chars).'
      onChange={setSymbol}
      placeholder='e.g. GLT'
    />
    <TextInput 
      title='Max supply:'
      tip='Maximum number of NFT available.'
      onChange={setMaxSupply}
      placeholder='e.g. 1'
    />
    <TextInput 
      title='Description:'
      tip='Introduction to your NFT.'
      onChange={setDescription}
      placeholder='e.g. This is the Atomic NFT token deployed by WeaveMint'
    />
    <FileUploader
      title='Select NFT asset:'
      tip='NFT asset will be stored to Arweave network together with nft contract.'
      onChange={setData}
    />
    
    <TextInput 
      title='Donate($AR):'
      tip='Donation will be transferred to $WMINT holders. Donation will support WeaveMint to keep it constantly updated.'
      onChange={setDonate}
      placeholder='e.g. 0.1'
      default='0.1'
    />

    {
      estFee &&
      <div className='centerResult'>
        <div className='darkRow'>
          Network fee to permanently store NFT asset is {estFee} $AR.
        </div>
      </div>
    }

    { !walletConnected &&
      <div className='centerButton'>
        <WalletSelectButton 
        setIsConnected={setWalletConnected}
        />
      </div>
    }
    { walletConnected &&
      <SubmitButton 
        buttonText='Mint'
        submitTask={onSubmit}
        buttonSize='Large'
        disabled={disabled}
      />
    }
  </>);
}