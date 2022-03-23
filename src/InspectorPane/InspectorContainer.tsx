import { Button } from "antd";
import React, { useContext } from "react";
import { globalContext } from "../App";
import { globalContextType } from "../App";

const InspectorContainer = (props: Object) => {
  const context: globalContextType = useContext(globalContext);
  const selection = context.fabricCanvas?.getActiveObject()
  console.log({ context });
  return (
    <>
      <Button onClick={() => context.fabricCanvas?.clear()} type="primary">
        Clear
      </Button>
      <pre>{selection && JSON.stringify(selection, null, 4)}</pre>
    </>
  );
};

export { InspectorContainer };
