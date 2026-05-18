// frontend/src/components/common/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  text = 'Loading...',
  showText = true 
}) => {
  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${size} ${color}`}>
        <div className="spinner"></div>
      </div>
      {showText && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;