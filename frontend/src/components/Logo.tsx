import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-10" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Isometric Cube Logo Representation */}
      <svg width="40" height="46" viewBox="0 0 40 46" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <path d="M20 0L37.3205 10V30L20 40L2.67949 30V10L20 0Z" fill="#89C2D9" />
        <path d="M20 0L37.3205 10V30L20 40" fill="url(#paint0_linear)" fillOpacity="0.2"/>
        <path d="M20 40L2.67949 30V10L20 0" fill="url(#paint1_linear)" fillOpacity="0.1"/>
        
        {/* White Lines / Circuit Representation */}
        <path d="M12 18V28" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <path d="M28 18V28" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <path d="M20 22V32" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="20" cy="22" r="3" fill="white"/>
        
        <defs>
          <linearGradient id="paint0_linear" x1="20" y1="0" x2="37" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0.4"/>
            <stop offset="1" stopColor="#89C2D9" stopOpacity="0"/>
          </linearGradient>
           <linearGradient id="paint1_linear" x1="2" y1="10" x2="20" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="black" stopOpacity="0.1"/>
            <stop offset="1" stopColor="#89C2D9" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>
      
      <span className="text-4xl font-extrabold tracking-tight text-sgm-tertiary">SGM</span>
    </div>
  );
};