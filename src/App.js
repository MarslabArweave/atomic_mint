import './App.css';

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Mint } from './components/mint';

const App = () => {
  return (
    <div id="app">
      <div id="content">
        <main>
          <Routes>
            <Route path="/" name="" element={<Home />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const Home = (props) => {

  return (
    <>
      <header>WeaveMint</header>
      <Mint />
    </>
  );
};

export default App;