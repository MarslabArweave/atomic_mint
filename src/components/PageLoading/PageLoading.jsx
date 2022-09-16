import React from 'react';
import { useEffect } from 'react';
import { ProgressSpinner } from '../ProgressSpinner/ProgressSpinner';
import "./PageLoading.css";

/*
 * @props submitTask: async function. Will be executed when button clicked.
 * @props submitParam: Object. Will apply to submitTask as input.
 * @props(option) onSuccess(ret: return for submitTask): function. Will be executed if submitTask returns {status: true, ...}
*/
export const PageLoading = (props) => {
    const [isInit, setIsInit] = React.useState(false);
    const [initResult, setInitResult] = React.useState("");

    useEffect(async () => {
      setInitResult("");
      props.submitTask(props.submitParam).then(ret => {
        setIsInit(false);
        if (ret.status === false) {
          setInitResult(ret.result);
          return;
        } else {
          props.onSuccess(ret);
        }
      });
    }, []);

    return (
      <>
        {isInit && <ProgressSpinner />}
        {!isInit && initResult !== '' &&
          <div className='centerResult'>
            <div className="darkRow">{initResult}</div>
          </div>
        }
      </>
    );
}