import React from "react";
import { Panel } from "rsuite";
import AddIcon from '@rsuite/icons/legacy/Plus';

const panelStyle = {
  width: 180,
  height: 350,
};

export const NFTAdd = (props) => {
  const ref = React.useRef();

  return (
    <>
      <Panel shaded bordered bodyFill style={panelStyle}>
        <div style={{...panelStyle, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <AddIcon style={{fontSize: 100}} />
        </div>
      </Panel>
    </>
  );
}