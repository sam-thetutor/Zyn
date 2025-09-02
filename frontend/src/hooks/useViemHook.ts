import { useMemo } from "react";
import { celo } from "viem/chains";
import { createPublicClient } from "viem";
import { http, custom } from "viem";
import { createWalletClient } from "viem";

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

const useViemHook = () => {
  const publicClient = useMemo(() => createPublicClient({
    chain: celo,
    transport: http("https://forno.celo.org"),
  }), []);

  const walletClient = useMemo(() => createWalletClient({
    chain: celo,
    transport: custom(window.ethereum),
  }), []);

  return {
    publicClient,
    walletClient,
  };
};

export default useViemHook;
