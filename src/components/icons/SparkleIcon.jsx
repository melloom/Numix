import React from 'react';

const SparkleIcon = ({ size = 16, className = "" }) => {
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
        <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      
      {/* Main sparkle */}
      <path 
        d="M12 0l2.5 7.5H22l-6 4.5 2.5 7.5L12 15l-6.5 4.5L8 12l-6-4.5h7.5L12 0z" 
        fill="url(#sparkleGradient)"
        opacity="0.9"
      />
      
      {/* Small sparkles */}
      <circle cx="20" cy="4" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="4" cy="20" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="22" cy="18" r="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
};

export default SparkleIcon; 