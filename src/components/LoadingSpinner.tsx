import { useState } from "react";
import { ClipLoader } from 'react-spinners';

const overrideStyles = {
  display: "block",
  margin: "0 auto",
};

export default function LoadingSpinner() {
  
  // Características del spinner
  const [isLoading] = useState(true);
  const color = "#222861"

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