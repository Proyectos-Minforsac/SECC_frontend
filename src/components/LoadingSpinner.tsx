import { useState } from "react";
import { ClipLoader } from 'react-spinners';

const overrideStyles = {
  display: "block",
  margin: "0 auto",
};

export default function LoadingSpinner() {
  const [isLoading, setItsLoading] = useState(true);
  const [color, setColor] = useState("#222861")
  
  return (
    <>
      <div className="loader-container">
        <ClipLoader 
          color={color}
          loading={isLoading}
          cssOverride={overrideStyles}
          size={50}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      </div>
    </>
  );
}