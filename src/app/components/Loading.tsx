import React from "react";

export const Loading: React.FC = () => {
  return (
    <div className="items-center ">
      <div className="lds-ellipsis">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
};
