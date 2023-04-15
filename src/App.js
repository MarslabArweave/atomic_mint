import 'rsuite/dist/rsuite.css';
import './App.css';

import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { MintToken } from './components/MintToken';
import { MintNFT } from './components/MintNFT';
import { Navigation } from './components/Navigation';
import { Button } from 'rsuite';

import mintTokenImg from './mint-token-bg.png';
import mintNFTImg from './mint-nft-bg.jpeg';

const App = () => {
  const [isWalletConnected, setIsWalletConnected] = React.useState(false);

  return (
    <div id="app">
      <div id="content">
        <Navigation setIsWalletConnected={setIsWalletConnected}/>
        <main>
          <Routes>
            <Route path="/" name="" element={<Home />} />
            <Route path="/token" name="" element={<Token walletConnect={isWalletConnected} />} />
            <Route path="/nft" name="" element={<NFT walletConnect={isWalletConnected} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const Home = (props) => {
  const centerStyle = {
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    margin: '2rem'
  };

  const navigate = useNavigate();
  return (
    <>
      <div style={{backgroundImage: `url(${mintTokenImg})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', padding: '1rem', borderRadius: 15}}>
        <Button 
          style={centerStyle}
          onClick={async ()=>{navigate(`/token`)}}
          appearance='ghost'
        >
          Mint Atomic Token
        </Button>
      </div>

      <br />

      <div style={{backgroundImage: `url(${mintNFTImg})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', padding: '1rem', borderRadius: 15}}>
        <Button 
          style={centerStyle}
          onClick={async ()=>{navigate(`/nft`)}}
          appearance='ghost'
        >
          Mint Atomic NFT
        </Button>
      </div>
    </>
  );
};

const NFT = (props) => {
  
  return (
    <>
      <MintNFT walletConnect={props.isWalletConnected} />
    </>
  );
};

const Token = (props) => {
  
  return (
    <>
      <MintToken walletConnect={props.isWalletConnected} />
    </>
  );
};

export default App;