import './App.css';

import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { MintToken } from './components/mintToken';
import { MintNFT } from './components/mintNFT';
import { SubmitButton } from './components/SubmitButton/SubmitButton';

const App = () => {
  return (
    <div id="app">
      <div id="content">
        <main>
          <Routes>
            <Route path="/" name="" element={<Home />} />
            <Route path="/token" name="" element={<Token />} />
            <Route path="/nft" name="" element={<NFT />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const Home = (props) => {
  const navigate = useNavigate();
  return (
    <>
      <header>WeaveMint</header>
      <SubmitButton 
        buttonText='Mint Token'
        submitTask={async ()=>{navigate(`/token`);return {status: true, result: ''}}}
        buttonSize='Large'
      />
      <SubmitButton
        buttonText='Mint NFT'
        submitTask={async ()=>{navigate(`/nft`);return {status: true, result: ''}}}
        buttonSize='Large'
      />
    </>
  );
};

const NFT = (props) => {
  
  return (
    <>
      <header>WeaveMint-NFT</header>
      <MintNFT />
    </>
  );
};

const Token = (props) => {
  
  return (
    <>
      <header>WeaveMint-Token</header>
      <MintToken />
    </>
  );
};

export default App;