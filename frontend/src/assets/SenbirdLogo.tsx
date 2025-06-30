import React from 'react';
import { Box, BoxProps } from '@mui/material';

interface SenbirdLogoProps extends BoxProps {
  showText?: boolean;
  size?: number;
}

export const SenbirdLogo: React.FC<SenbirdLogoProps> = ({ 
  showText = true, 
  size = 80,
  ...props 
}) => {
  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center"
      {...props}
    >
      <img 
        src="/senbird-logo.png" 
        alt="Senbird Tea Logo"
        style={{ 
          width: size, 
          height: size,
          objectFit: 'contain'
        }}
      />
      
      {showText && (
        <Box mt={1.5} fontFamily="Arial, sans-serif" fontWeight={900} display="flex">
          <span style={{ color: '#000000', fontSize: `${size * 0.4}px`, letterSpacing: '3px' }}>SENBIRD</span>
          <span style={{ color: '#4CAF50', fontSize: `${size * 0.4}px`, letterSpacing: '3px' }}>TEA</span>
        </Box>
      )}
    </Box>
  );
};

// Simplified version for small spaces (just the icon)
export const SenbirdIcon: React.FC<BoxProps & { size?: number }> = ({ size = 40, ...props }) => {
  return (
    <Box {...props}>
      <img 
        src="/senbird-logo.png" 
        alt="Senbird Tea Logo"
        style={{ 
          width: size, 
          height: size,
          objectFit: 'contain'
        }}
      />
    </Box>
  );
};