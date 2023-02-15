import React from "react";
import { Form, Progress, Toggle, Tooltip, Whisper, Modal, Message, Loader, InputGroup, Input } from "rsuite";
import { addToCollectible, arAdd, arLessThan, deployAtomicNFT, deployCollectible, getBalance, getFeeEstimation, getWalletAddress } from "../lib/api";
import { NFTAdd } from "./NFTAdd";
import { NFTCard } from "./NFTCard";
import QuestionIcon from '@rsuite/icons/legacy/QuestionCircle2';
import { SubmitButton } from "./SubmitButton/SubmitButton";
import { add, div } from "../lib/math";
import copy from 'copy-to-clipboard';
import CopyIcon from '@rsuite/icons/Copy';

const cardStyle = {
  display: 'inline-block',
  margin: '1rem',
  cursor: 'pointer'
};

const itemTitleStyle = {
  fontSize: '1rem',
  color: 'white'
};

export const MintNFT = (props) => {
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState('active');
  const [progressStatus, setProgressStatus] = React.useState('Begin ...');
  const [txIDs, setTxIDs] = React.useState({});
  const [networkFee, setNetworkFee] = React.useState('0.00');
  const [estimatingFee, setEstimatingFee] = React.useState(false);
  const [percent, setPercent] = React.useState(0);
  const [useCollectible, setUseCollectible] = React.useState(true);
  const [collectibleForm, setCollectibleForm] = React.useState({name: '', description: ''});
  const [nftforms, setNftForms] = React.useState([]);

  const onDelete = (index) => {
    setNftForms(nftforms.filter((_, i)=>i!==index));
  };

  const clearProgress = () => {
    setPercent(0);
    setStatus('active');
    setTxIDs({});
  }

  const onChange = (index, formValue) => {
    let newNFTForms = Array.from(nftforms);
    newNFTForms[index] = formValue;
    setNftForms(newNFTForms);
    estimateFee(newNFTForms);
  };

  const onClickAdd = () => {
    let newNFTForms = Array.from(nftforms);
    newNFTForms.push({});
    setNftForms(newNFTForms);
  };

  const estimateFee = async (nftForms) => {
    setEstimatingFee(true);
    let totalFee = '0.01';
    for (let i = 0; i < nftForms.length; i ++) {
      const asset = nftForms[i].asset;
      if (asset) {
        const fee = await getFeeEstimation(asset.data);
        console.log(fee);
        setNetworkFee(arAdd(fee, totalFee));
      }
    }
    setEstimatingFee(false);
  };

  const deployContract = async () => {
    clearProgress();

    // check wallet connection
    if (!getWalletAddress()) {
      return {status: false, result: 'Please connect wallet first!'};
    }

    // check form value validity
    if (useCollectible && (collectibleForm.name === '' || collectibleForm.description === '')) {
      return {status: false, result: 'Please fill collectible forms or make toggle off!'};
    }
    if (nftforms.length === 0) {
      return {status: false, result: 'Please add at least one Atomic-NFT!'};
    }
    for (let i = 0; i < nftforms.length; i ++) {
      const form = nftforms[i];
      const keys = Object.keys(form);
      if (keys.length === 0) {
        return {status: false, result: `Please fill the form of NFTs first!`};
      }
      for (const key of keys) {
        if (form[key] === '') {
          return {status: false, result: `The '${key}' of the ${i}th NFT should not be empty!`};
        }
      }
    }
    
    // check network fee
    const balanceRet = await getBalance('ar');
    if (balanceRet.status && arLessThan(balanceRet.result, networkFee)) {
      return {status: false, result: `Insufficient $AR balance to cover network fee!`};
    }

    // open progress message-box
    setOpen(true);

    let newTxIDs = {};

    // deploy collectible contract
    let collectibleAddress = '';
    setPercent(5);
    setProgressStatus('Deploying collectible contract ...');
    if (useCollectible) {
      const ret = await deployCollectible(collectibleForm);
      if (ret.status === false) {
        setStatus('fail');
        return ret;
      }
      collectibleAddress = ret.result;
      newTxIDs.collectible = collectibleAddress;
      setTxIDs(newTxIDs);
    }

    // deploy nfts to Arweave Layer1 
    let nftAddresses = [];
    const nftNums = nftforms.length;
    setPercent(10);
    setProgressStatus('Deploying Atomic-NFTs ...');
    for (const form of nftforms) {
      const ret = await deployAtomicNFT(form, collectibleAddress);
      if (ret.status === false) {
        setStatus('fail');
        return ret;
      }
      nftAddresses.push(ret.result);
      setPercent(add(10, div(80, nftNums)).toFixed(0));
      const tempTxIDs = {...newTxIDs};
      tempTxIDs.nfts = nftAddresses;
      setTxIDs(tempTxIDs);
    }

    // add nft addresses to collectible
    setPercent(90);
    setProgressStatus('Adding Atomic-NFTs to collectible ...');
    if (useCollectible) {
      for (const nftAddr of nftAddresses) {
        const ret = await addToCollectible(collectibleAddress, nftAddr);
        if (ret.status === false) {
          setStatus('fail');
          return ret;
        }
      }
    }

    // set progress to 'complete' status
    setPercent(100);
    setProgressStatus('Atomic-NFTs are deployed successfully!');
    setStatus('success');
    return {status: true, result: 'Atomic-NFTs are deployed successfully!'};
  };

  const renderNFTCard = (index) => {
    return (
      <div style={cardStyle}>
        <NFTCard
          index={index}
          onChange={onChange}
          onDelete={onDelete}
        />
      </div>
    );
  }

  const renderAddress = (address) => {
    return (
      <InputGroup inside>
        <Input readOnly value={address} />
        <InputGroup.Button>
          <CopyIcon onClick={()=>{copy(address)}} />
        </InputGroup.Button>
      </InputGroup>
    );
  };

  return (
    <>
      <div style={{margin: '1rem'}}>
        <label style={{color: 'white'}}>Wrapped into Collectible:</label>
        &nbsp;&nbsp;&nbsp;
        <Toggle defaultChecked onChange={setUseCollectible} />
        &nbsp;&nbsp;&nbsp;
        <Whisper speaker={<Tooltip> Collectible is a box containing various NFTs. If you want to mint a set of NFTs, you can use collectible to wrap them.</Tooltip>}>
          <QuestionIcon />
        </Whisper>
        <br/><br/>
        {
          useCollectible &&
          <Form onChange={setCollectibleForm} formValue={collectibleForm} fluid>
            <Form.Group controlId="name">
              <Form.ControlLabel style={itemTitleStyle}>Collectible Name</Form.ControlLabel>
              <Form.Control name="name" />
              <Form.HelpText>Choose a name for your Collectible.</Form.HelpText>
            </Form.Group>

            <Form.Group controlId="description">
              <Form.ControlLabel style={itemTitleStyle}>Description</Form.ControlLabel>
              <Form.Control name="description" />
              <Form.HelpText>Description to your collectible.</Form.HelpText>
            </Form.Group>
          </Form>
        }
      </div>
      {nftforms.map((_, i)=>renderNFTCard(i))}
      <div style={cardStyle} onClick={onClickAdd}>
        <NFTAdd />
      </div>

      <div style={{margin: '1rem', marginBottom: '3rem'}}>
      <Message >
        Network Fee Estimation: 
        {
          estimatingFee ? 
          <Loader /> :
          networkFee
        }
        $AR
      </Message>
      </div>

      <div style={{margin: '1rem', marginBottom: '3rem'}}>
      <SubmitButton
        buttonText='Deploy atomic-NFTs'
        submitTask={deployContract}
        block={true}
      />
      </div>

      <Modal backdrop='static' open={open} onClose={()=>setOpen(false)}>
        <Modal.Header>
          <Modal.Title>Deploying atomic-NFTs</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Progress.Line active percent={percent} status={status} />
          <p style={{color: 'black', fontSize: '1rem'}}>{progressStatus}</p>
          <br/>
          {
            txIDs !== {} && 
            <Message showIcon type="success" header='Addresses'>
              <p>Take a unique name for your collectible or NFTs on Arweave via <a href='https://arweave.net/wbo15PDbhXjpGMSGV8wh-XhlfFgjXKOZPw-wvEE24xI'>Polaris</a> name service.</p>
              <br/>
              Collectible:<br/>
              {txIDs.collectible && renderAddress(txIDs.collectible)}
              Atomic-NFTs:<br/>
              {txIDs.nfts && txIDs.nfts.map(v=>renderAddress(v))}
            </Message>
          }
        </Modal.Body>
      </Modal>
    </>
  );
};