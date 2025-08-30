import { useCallback, useMemo } from 'react';
import { usePredictionMarketCore } from './usePredictionMarketCore';
import { usePredictionMarketClaims } from './usePredictionMarketClaims';

export const usePredictionMarket = () => {
  const coreHook = usePredictionMarketCore();
  const claimsHook = usePredictionMarketClaims();

  return {
    // Core contract functions
    ...coreHook,
    
    // Claims contract functions
    ...claimsHook,
    
    // Fee information
    marketCreationFee: coreHook.marketCreationFee,
    usernameChangeFee: coreHook.usernameChangeFee,
  };
};
