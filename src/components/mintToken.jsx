import React from "react";
import { connectWallet, deployPst, getWalletAddress } from "../lib/api";
import { Selector } from "./Selector/Selector";
import { SubmitButton } from "./SubmitButton/SubmitButton";
import { TextInput } from "./TextInput/TextInput";
import { WalletSelectButton } from "./WalletSelectButton/WalletSelectButton";

export const MintToken = (props) => {
  const [walletConnected, setWalletConnected] = React.useState(false);

  const [tokenName, setTokenName] = React.useState("");
  const [ticker, setTicker] = React.useState("");
  const [maxSupply, setMaxSupply] = React.useState("");
  const [decimals, setDecimals] = React.useState("");
  const [donate, setDonate] = React.useState("0.1");
  const [disabled, setDisabled] = React.useState(true);

  React.useEffect(async () => {
    if (walletConnected) {
      connectWallet('use_wallet');
    }
  }, [walletConnected]);

  React.useEffect(async () => {
    if (tokenName !== '' && ticker !== '' && maxSupply !== '' &&
        decimals && donate !== '') {
        setDisabled(false);
        return;
    } else {
      setDisabled(true);
    }
  }, [tokenName, ticker, maxSupply, decimals, donate]);

  async function onSubmit() {
    const walletAddr = getWalletAddress();
    var initialState;
    const numSupply = Number(maxSupply);
    const numDecimals = Number(decimals);
    if (isNaN(numSupply) || !Number.isInteger(numSupply)) {
      return {status: false, result: 'Max supply should be positive integer!'};
    }
    if (isNaN(numDecimals) || !Number.isInteger(numDecimals)) {
      return {status: false, result: 'Decimals should be positive integer!'};
    }
    if (numSupply * Math.pow(10, numDecimals) > 0xFFFFFFFFFFFFFFFF) {
      return {status: false, result: 'Precision overflow. Please reduce MaxSupply or Decimals!'};
    }
    
    initialState = {
      decimals: numDecimals,
      totalSupply: numSupply * Math.pow(10, numDecimals),
      symbol: ticker,
      name: tokenName,
      owner: walletAddr,
      balances: {
        [walletAddr]: numSupply * Math.pow(10, numDecimals),
      },
      allowances: {},
    };
    return await deployPst(initialState, donate);
  }

  return (
    <>
      <div className='textBlock'>
        <div className='textMidiumKey'>Create your WRC-20 token on Arweave</div>
      </div>
      <div className='textBlock'>
      <div className='textSmallValue'><a href='https://github.com/warp-contracts/wrc'>WRC-20</a> is a token standard recommended by the Warp Contract team. It is written in RUST language and has undergone a complete security audit.</div>
        <div className='textSmallValue'>By using WeaveMint, you can easily deploy standard WRC-20 token on Arweave chain with several clicks.</div>
        <div className='textSmallValue'>No coding skills are required.</div>
        <div className='textSmallValue'>After deployed, you can find your token infos and make transactions <a href='https://arweave.net/_tfx0j4nhCwRDYmgU6XryFDceF52ncPKVivot5ijwdQ'><b>HERE</b></a>.</div>
      </div>
      <TextInput 
        title='Token name:'
        tip='Choose a name for your token.'
        onChange={setTokenName}
        placeholder='e.g. MARS Coin'
      />
      <TextInput 
        title='Symbol:'
        tip='Choose a symbol for your token (usually 2-5 chars).'
        onChange={setTicker}
        placeholder='e.g. MARS'
      />
      <TextInput 
        title='Max supply:'
        tip='Maximum number of tokens available.'
        onChange={setMaxSupply}
        placeholder='e.g. 66000000'
      />
      <TextInput 
        title='Decimals:'
        tip='The precision after the decimal point.'
        onChange={setDecimals}
        placeholder='e.g. 2'
      />
      
      <TextInput 
        title='Donate($AR):'
        tip='Donation will be transferred to $WMINT holders. Donation will support WeaveMint to keep it constantly updated.'
        onChange={setDonate}
        placeholder='e.g. 0.1'
        default='0.1'
      />
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
    </>
  );
}