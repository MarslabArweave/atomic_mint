import React from "react";
import { Form, Input, InputGroup, Message } from "rsuite";
import { connectWallet, deployToken, getWalletAddress } from "../lib/api";
import { SubmitButton } from "./SubmitButton/SubmitButton";
import copy from 'copy-to-clipboard';
import CopyIcon from '@rsuite/icons/Copy';

const aboudTokenStyle = {
  marginTop: '0.5rem',
  marginBottom: '0.5rem',
  fontSize: '1rem',
};

const centerStyle = {
  justifyContent: 'center', 
  alignItems: 'center',
  margin: '3rem',
};

const itemTitleStyle = {
  fontSize: '1rem',
  color: 'white'
};

export const MintToken = (props) => {

  const [tokenName, setTokenName] = React.useState("");
  const [symbol, setSymbol] = React.useState("");
  const [maxSupply, setMaxSupply] = React.useState("");
  const [decimals, setDecimals] = React.useState("");
  const [disabled, setDisabled] = React.useState(true);
  const [tokenAddress, setTokenAddress] = React.useState();

  React.useEffect(async () => {
    if (tokenName === '') { setDisabled(true); return; }
    if (symbol === '') { setDisabled(true); return; }
    if (maxSupply === '') { setDisabled(true); return; }
    if (decimals === '') { setDisabled(true); return; }
    setDisabled(false);
  }, [tokenName, symbol, maxSupply, decimals]);

  React.useEffect(async () => {
    if (props.walletConnected) {
      connectWallet('use_wallet');
    }
  }, [props.walletConnected]);

  const formOnchange = async (formValue) => {
    setTokenName(formValue['name']);
    setSymbol(formValue['symbol']);
    setMaxSupply(formValue['supply']);
    setDecimals(formValue['decimals']);
  };

  async function onSubmit() {
    setTokenAddress(undefined);

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
      return {status: false, result: 'Precision overflows. Please reduce MaxSupply or Decimals!'};
    }
    
    initialState = {
      decimals: numDecimals,
      totalSupply: numSupply * Math.pow(10, numDecimals),
      symbol: symbol,
      name: tokenName,
      owner: walletAddr,
      balances: {
        [walletAddr]: numSupply * Math.pow(10, numDecimals),
      },
      allowances: {},
    };
    
    const ret = await deployToken(initialState);

    if (ret.status === false) {
      return ret;
    }

    setTokenAddress(ret.txID);
    return ret;
  }

  return (
    <>
      <Message showIcon type="info" header="About WRC-20 Token"  style={centerStyle}>
      <div style={aboudTokenStyle}><a href='https://github.com/warp-contracts/wrc'>WRC-20</a> is a token standard recommended by the Warp Contract team. It is written in RUST language and has undergone a complete security audit.</div>
      <div style={aboudTokenStyle}>By using WeaveMint, you can easily deploy standard WRC-20 token on Arweave network with several clicks.</div>
      <div style={aboudTokenStyle}>No coding skills are required.</div>
      <div style={aboudTokenStyle}>After deployed, you can find your token info and make transactions <a href='https://arweave.net/G2t61jWAFfoTjaybLtjouWEM9IFZoNdxJMX2GzIXUSA'><b>HERE</b></a>.</div>
      </Message>

      <Form style={centerStyle} onChange={formOnchange} fluid>
        <Form.Group controlId="name">
          <Form.ControlLabel style={itemTitleStyle}>TokenName</Form.ControlLabel>
          <Form.Control name="name" />
          <Form.HelpText>Choose a name for your token.</Form.HelpText>
        </Form.Group>

        <Form.Group controlId="symbol">
          <Form.ControlLabel style={itemTitleStyle}>Symbol</Form.ControlLabel>
          <Form.Control name="symbol" />
          <Form.HelpText>Choose a symbol for your token (usually 2-5 chars).</Form.HelpText>
        </Form.Group>

        <Form.Group controlId="supply">
          <Form.ControlLabel style={itemTitleStyle}>Max Supply</Form.ControlLabel>
          <Form.Control name="supply" />
          <Form.HelpText>Maximum number of tokens available.</Form.HelpText>
        </Form.Group>

        <Form.Group controlId="decimals">
          <Form.ControlLabel style={itemTitleStyle}>Decimals</Form.ControlLabel>
          <Form.Control name="decimals" />
          <Form.HelpText>The precision after the decimal point.</Form.HelpText>
        </Form.Group>
        
        {
          tokenAddress &&
          <Message showIcon type="success" header='Token Address'>
            <InputGroup inside>
              <Input readOnly value={tokenAddress} />
              <InputGroup.Button>
                <CopyIcon onClick={()=>{copy(tokenAddress)}} />
              </InputGroup.Button>
            </InputGroup>
          </Message>
        }

        <Form.Group>
          <SubmitButton
            buttonText='Mint Token'
            submitTask={onSubmit}
            disabled={disabled}
          />
        </Form.Group>
      </Form>
    </>
  );
}