import React from "react";
import domtoimage from 'dom-to-image';
import { Panel, Placeholder, Modal, Button, Form, Whisper, Popover, Dropdown } from "rsuite";
import { FileUploader } from "./FileUploader/FileUploader";
import QuestionIcon from '@rsuite/icons/legacy/Question';
import VideoIcon from '@rsuite/icons/legacy/VideoCamera';
import AudioIcon from '@rsuite/icons/legacy/FileAudioO';

const panelStyle = {
  width: 180,
  height: 350
};

const centerStyle = {
  justifyContent: 'center', 
  alignItems: 'center',
  marginLeft: '3rem',
  marginRight: '3rem',
};

const itemTitleStyle = {
  fontSize: '1rem',
};

const panelTitleStyle = {
  color: 'white',
};

const contentStyle = {
  fontSize: '0.5rem',
  color: 'white'
};

const containerStyle = {
  height: 180, 
  width: 180,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

export const NFTCard = (props) => {
  const ref = React.useRef();

  const [formValue, setFormValue] = React.useState({
    'name': '',
    'symbol': '',
    'supply': '',
    'description': '',
    'asset': '',
  });
  const [open, setOpen] = React.useState(false);
  const [previewDom, setPreviewDom] = React.useState(<div style={containerStyle}></div>);

  const handleClose = () => setOpen(false);

  const showContent = (content, defaultContent) => content ? content : defaultContent;

  React.useEffect(()=>{
    setOpen(props.showModal);
  }, [props.showModal]);

  React.useEffect(()=>{
    setPreview();
  }, [formValue]);

  const formOnchange = async (formValue) => {
    setFormValue(formValue);
    props.onChange(props.index, formValue);
  };

  const handleSelectMenu = (eventKey, event) => {
    if (eventKey === 'edit') {
      setOpen(true);
    } else if (eventKey === 'delete') {
      props.onDelete(props.index);
    }
    ref.current.close();
  }

  const MenuPopover = React.forwardRef(({ onSelect, ...rest }, ref) => (
    <Popover ref={ref} {...rest} full>
      <Dropdown.Menu onSelect={onSelect}>
        <Dropdown.Item eventKey='edit'>Edit</Dropdown.Item>
        <Dropdown.Item eventKey='delete'>Delete</Dropdown.Item>
      </Dropdown.Menu>
    </Popover>
  ));

  const setPreview = async () => {
    var htmlToRender;
    if (!formValue.asset) {
      setPreviewDom(<div style={containerStyle}></div>);
      return;
    }
    switch (formValue.asset.type.split('/')[0]) {
      case 'image':
        htmlToRender = <img src={URL.createObjectURL(formValue.asset)} width="180" />;
        break;
      case 'video':
        htmlToRender = <VideoIcon style={{fontSize: 100, textAlign: 'center'}} />;
        break;
      case 'audio':
        htmlToRender = <AudioIcon style={{fontSize: 100, textAlign: 'center'}} />;
        break;
      case 'text':
        console.log(await (formValue.asset.text()));
        htmlToRender = <p>{(await formValue.asset.text()).substring(0, 128)}</p>;
        break;
      default:
        htmlToRender = <QuestionIcon style={{fontSize: 100, textAlign: 'center'}} />;
        break;
    }
    setPreviewDom(<div style={containerStyle}>{htmlToRender}</div>);
  };

  return (
    <>
      <Whisper
        placement="auto"
        controlId="control-id-with-dropdown"
        trigger="click"
        ref={ref}
        speaker={<MenuPopover onSelect={handleSelectMenu} />}
      >
        <Panel shaded bordered bodyFill style={panelStyle}>
          {previewDom}
          <Panel header={<p style={panelTitleStyle}> {showContent(formValue.name, 'Atomic-NFT')} </p>}>
            <p style={contentStyle}>
              Asset Type: {showContent(formValue.asset?.type, 'Unknown')}
            </p>
            <p style={contentStyle}>
              Symbol: {showContent(formValue.symbol, 'None')}
            </p>
            <p style={contentStyle}>
              Description: {showContent(formValue.description, 'None')}
            </p>
            <p style={contentStyle}>
              Max Supply: {showContent(formValue.supply, 'N/A')}
            </p>
          </Panel>
        </Panel>
      </Whisper>
      
      <Modal backdrop={true} open={open} onClose={handleClose}>
        <Modal.Header>
          <Modal.Title> Edit Atomic-NFT Info </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form style={centerStyle} onChange={formOnchange} formValue={formValue} fluid>
            <Form.Group controlId="name">
              <Form.ControlLabel style={itemTitleStyle}>NFT Name</Form.ControlLabel>
              <Form.Control name="name" />
              <Form.HelpText>Choose a name for your Atomic-NFT.</Form.HelpText>
            </Form.Group>

            <Form.Group controlId="symbol">
              <Form.ControlLabel style={itemTitleStyle}>Symbol</Form.ControlLabel>
              <Form.Control name="symbol" />
              <Form.HelpText>Choose a symbol for your Atomic-NFT (usually 2-5 chars).</Form.HelpText>
            </Form.Group>

            <Form.Group controlId="supply">
              <Form.ControlLabel style={itemTitleStyle}>Max Supply</Form.ControlLabel>
              <Form.Control name="supply" />
              <Form.HelpText>Maximum number of Atomic-NFT available.</Form.HelpText>
            </Form.Group>

            <Form.Group controlId="description">
              <Form.ControlLabel style={itemTitleStyle}>Description</Form.ControlLabel>
              <Form.Control name="description" />
              <Form.HelpText>Introduction to your Atomic-NFT.</Form.HelpText>
            </Form.Group>

            <Form.Group controlId="asset">
              <Form.ControlLabel style={itemTitleStyle}>Asset</Form.ControlLabel>
              <Form.Control name="asset" accepter={FileUploader} />
              <Form.HelpText>Atomic-NFT asset will be stored to Arweave network together with nft contract.</Form.HelpText>
            </Form.Group>

          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={handleClose} appearance="subtle">
            Ok
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
