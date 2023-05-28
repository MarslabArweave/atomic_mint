import React from 'react';
import { Input } from 'rsuite';
import "./FileUploader.css";

/*
 * @props title: string.
 * @props tip: string.
 * @props onChange: function(file).
*/
export const FileUploader = (props) => {
  const [file, setFile] = React.useState();

  React.useEffect(()=>{
    setFile(props.value);
  }, [props.value]);

  const onFileChange = async (event) => {
    const file = event.target.files[0];
    file.data = await file.arrayBuffer();
    props.onChange(file);
    setFile(file);
  }

  return (
    <div>
      <div className='title'> {props.title} </div>
        <a className='file'> Select File
          <input type='file' name='file' accept='image/*' onChange={onFileChange} />
        </a>
        {file && 
          <p> 
            file: {file.name}; 
            size: {Math.round(Number(file.size)/1000)} KB; 
            type:{file?.type || 'Unknown'} 
          </p>
        }
    </div>
  );
}