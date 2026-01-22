import React from 'react';

// NOTE: We keep the component names (RetroButton, RetroPanel) to minimize 
// refactoring in other files, but the design is now Modern Cyan/Blue.

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

export const RetroButton: React.FC<RetroButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  let baseStyles = "bg-gradient-to-r text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95";
  // Primary: Cyan to Blue gradient
  let colorStyles = "from-cyan-500 to-blue-600"; 
  
  if (variant === 'secondary') {
    colorStyles = "from-slate-100 to-slate-200 text-slate-700 border border-slate-200 hover:bg-slate-50";
    baseStyles = "shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95"; // Adjust for light bg
  } else if (variant === 'danger') {
    colorStyles = "from-rose-500 to-pink-600";
  } else {
    // Primary default: Cyan to Blue with Cyan Ring
     colorStyles = "from-cyan-500 to-blue-600 ring-2 ring-cyan-200 ring-offset-1";
  }

  return (
    <button 
      className={`
        relative overflow-hidden
        ${baseStyles} ${colorStyles}
        font-nunito font-bold rounded-2xl
        text-base sm:text-lg
        py-3 px-6
        transition-all duration-200 ease-out
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
};

export const RetroPanel: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-card border border-white/60 ${className}`}>
      {children}
    </div>
  );
};

export const CrownIcon: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
    fill="url(#crownGradient)" stroke="none" />
    <defs>
      <linearGradient id="crownGradient" x1="2" y1="2" x2="22" y2="21.02" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" /> {/* Lighter Yellow */}
        <stop offset="1" stopColor="#EAB308" /> {/* Gold */}
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="2" fill="white" opacity="0.6"/>
    <circle cx="7" cy="14" r="1.5" fill="#06B6D4"/> {/* Cyan Jewel */}
    <circle cx="17" cy="14" r="1.5" fill="#3B82F6"/> {/* Blue Jewel */}
  </svg>
);

export const TrophyIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C13.1 2 14 2.9 14 4V5H19C20.1 5 21 5.9 21 7V9C21 11.2 19.2 13 17 13H14V14C14 15.1 13.1 16 12 16H8C6.9 16 6 15.1 6 14V13H3C0.8 13 -1 11.2 -1 9V7C-1 5.9 -0.1 5 1 5H6V4C6 2.9 6.9 2 8 2H12ZM17 7H14V11H17C18.1 11 19 10.1 19 9V7H17ZM3 7V9C3 10.1 3.9 11 5 11H6V7H3ZM8 18H12V20H8V18ZM6 20H14V22H6V20Z" 
      fill="#F59E0B" 
      stroke="#78350F" strokeWidth="1.5" strokeLinejoin="round"
    />
  </svg>
);