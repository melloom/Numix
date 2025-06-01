import React from 'react';

const InstallIcon = ({ size = 32, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="installGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      
      {/* Phone/Device Frame */}
      <rect 
        x="6" 
        y="2" 
        width="12" 
        height="20" 
        rx="3" 
        ry="3" 
        fill="currentColor" 
        stroke="url(#installGradient)" 
        strokeWidth="2"
      />
      
      {/* Screen */}
      <rect 
        x="8" 
        y="5" 
        width="8" 
        height="12" 
        rx="1" 
        fill="url(#installGradient)" 
        opacity="0.8"
      />
      
      {/* Download Arrow */}
      <path 
        d="M12 8v6m-3-3l3 3 3-3" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Bottom indicator */}
      <circle 
        cx="12" 
        cy="19" 
        r="1" 
        fill="url(#installGradient)"
      />
    </svg>
  );
};

export default InstallIcon; 