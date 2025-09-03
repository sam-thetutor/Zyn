'use client';

import React, { type ReactNode } from 'react';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { base } from 'wagmi/chains';

interface MiniAppWrapperProps {
  children: ReactNode;
}

export const MiniAppWrapper: React.FC<MiniAppWrapperProps> = ({ children }) => {
  return (
    <MiniKitProvider chain={base}>
      {children}
    </MiniKitProvider>
  );
};

export default MiniAppWrapper;
