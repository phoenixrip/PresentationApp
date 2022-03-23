import { Button } from "antd";
import React, { useContext } from "react";
import { globalContext } from "../App";
import { globalContextType } from "../App";

const InspectorContainer = (props: Object) => {
  const context: globalContextType = useContext(globalContext);
  console.log({ context });
  return (
    <>
      <Button onClick={() => context.fabricCanvas?.clear()} type="primary">
        Clear
      </Button>
    </>
  );
};

export { InspectorContainer };
