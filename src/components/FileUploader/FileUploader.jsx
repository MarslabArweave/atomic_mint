import React from 'react';
import "./FileUploader.css";

/*
 * @props title: string.
 * @props tip: string.
 * @props onChange: function(file).
*/
export const FileUploader = (props) => {
  const [file, setFile] = React.useState();

  function onFileChange(event) {
    props.onChange(event.target.files[0]);
    setFile(event.target.files[0]);
  }

  return (
    <div className='textDiv'>
      <div className='title'> {props.title} </div>
        <a className='file'> Select File
          <input type='file' name='file' onChange={onFileChange} />
        </a>
        {file && 
          <p className='fileDescription'> 
            file: {file.name}; 
            size: {Math.round(Number(file.size)/1000)} KB; 
            type:{file?.type || 'Unknown'} 
          </p>
        }
      <div className='tip'> ❕{props.tip} </div>
    </div>
  );
}