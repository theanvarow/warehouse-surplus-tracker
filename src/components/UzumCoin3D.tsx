'use client';

import React from 'react';

interface UzumCoin3DProps {
  className?: string;
  size?: number;
}

export const UzumCoin3D: React.FC<UzumCoin3DProps> = ({ className = '', size = 200 }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative select-none filter drop-shadow-[0_20px_35px_rgba(112,0,255,0.35)] ${className}`}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Outer Coin Edge Gradient */}
          <linearGradient id="coinEdge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B3DFF" />
            <stop offset="50%" stopColor="#7000FF" />
            <stop offset="100%" stopColor="#4F00B5" />
          </linearGradient>

          {/* Coin Face Gradient */}
          <radialGradient id="coinFace" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="45%" stopColor="#7E22CE" />
            <stop offset="85%" stopColor="#581C87" />
            <stop offset="100%" stopColor="#3B0764" />
          </radialGradient>

          {/* 3D Emboss Bevel */}
          <linearGradient id="bevelLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D8B4FE" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3B0764" stopOpacity="0.6" />
          </linearGradient>

          {/* U Logo 3D Surface */}
          <linearGradient id="logoSurface" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#E9D5FF" />
            <stop offset="70%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>

          {/* Drop shadow */}
          <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
          </filter>
        </defs>

        {/* 3D Coin Rim & Edge Thickness */}
        <ellipse cx="100" cy="108" rx="88" ry="84" fill="#3B0764" />
        <ellipse cx="100" cy="104" rx="88" ry="84" fill="url(#coinEdge)" />

        {/* Main Coin Face */}
        <circle cx="100" cy="96" r="82" fill="url(#coinFace)" stroke="#D8B4FE" strokeWidth="2.5" strokeOpacity="0.6" />

        {/* Inner Groove Ring */}
        <circle cx="100" cy="96" r="72" fill="none" stroke="#3B0764" strokeWidth="3" opacity="0.6" />
        <circle cx="100" cy="96" r="70" fill="none" stroke="#D8B4FE" strokeWidth="1.5" strokeOpacity="0.4" />

        {/* 3D Stylized U & Power Logo Shadow */}
        <g transform="translate(0, 4)">
          {/* Vertical Bar Shadow */}
          <rect x="91" y="52" width="18" height="42" rx="9" fill="#2E0854" />
          {/* U Arc Shadow */}
          <path
            d="M 62 68 
               L 62 108 
               C 62 138, 138 138, 138 108 
               L 138 68 
               L 122 68 
               L 122 106 
               C 122 124, 78 124, 78 106 
               L 78 68 Z"
            fill="#2E0854"
          />
        </g>

        {/* 3D Stylized U & Power Logo Face (Vivid Purple Metallic) */}
        <g>
          {/* Vertical Center Power Bar */}
          <rect x="91" y="48" width="18" height="42" rx="9" fill="url(#logoSurface)" stroke="#FFFFFF" strokeWidth="1" />
          {/* Top highlight cap */}
          <rect x="93" y="50" width="14" height="8" rx="4" fill="#FFFFFF" opacity="0.8" />

          {/* U Arc Shape */}
          <path
            d="M 62 64 
               L 62 104 
               C 62 134, 138 134, 138 104 
               L 138 64 
               L 122 64 
               L 122 102 
               C 122 120, 78 120, 78 102 
               L 78 64 Z"
            fill="url(#logoSurface)"
            stroke="#FFFFFF"
            strokeWidth="1"
          />

          {/* Top Left / Right Highlights */}
          <rect x="62" y="64" width="16" height="6" rx="2" fill="#FFFFFF" opacity="0.9" />
          <rect x="122" y="64" width="16" height="6" rx="2" fill="#FFFFFF" opacity="0.9" />
        </g>

        {/* Glossy Reflection Arc across top */}
        <path
          d="M 36 75 C 60 40, 140 40, 164 75 C 130 55, 70 55, 36 75 Z"
          fill="#FFFFFF"
          opacity="0.35"
        />
      </svg>
    </div>
  );
};
