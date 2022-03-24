import { Button } from "antd";
import React, { useContext } from "react";
import { globalContext } from "../App";
import { globalContextType } from "../App";
import { Input } from 'antd';

const InspectorContainer = (props: Object) => {
  const context: globalContextType = useContext(globalContext);
  const selection: any | undefined = context.fabricCanvas?.getActiveObject()

  const width: number | undefined = selection ? selection.width * selection.scaleX : undefined
  const height: number | undefined = selection ? selection.height * selection.scaleY : undefined

  return (
    <>
      {!selection && 
      <p>no element selected</p>
      }

      {selection &&
      <>
        <p>Dimensions</p>
        <p>Width: </p>
        <p>Height: </p>
        <Input addonBefore="Width:" value={width} />
        <Input addonBefore="Height:" value={height}/>

        <pre>{selection && JSON.stringify(selection, null, 4)}</pre>
      </>
      }
    </>
  );
};

export { InspectorContainer };
