import 'rsuite/dist/rsuite.css';
import './App.css';

import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { MintToken } from './components/MintToken';
import { MintNFT } from './components/MintNFT';
import { Navigation } from './components/Navigation';
import { Button } from 'rsuite';

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
      <Button 
        style={centerStyle}
        onClick={async ()=>{navigate(`/token`)}}
      >
        Mint WRC-20 Token
      </Button>
      <Button 
        style={centerStyle}
        onClick={async ()=>{navigate(`/nft`)}}
      >
        Mint Atomic-NFT
      </Button>
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