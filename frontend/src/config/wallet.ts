import { http } from 'wagmi'
import { celo, base } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'
import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { createAppKit } from '@reown/appkit/react'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Project ID for WalletConnect/AppKit
const projectId = "a34b492d8d46d7145fa4093030be0913"

// Networks configuration
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [base, celo] // Base first, then Celo

// Create base wagmi config with enhanced connectors
export const baseWagmiConfig = {
  chains: networks,
  connectors: [
    coinbaseWallet({
      appName: 'Zyn Prediction Markets',
      appLogoUrl: 'https://zyn.com/logo.png',
      preference: 'all', // Supports both EOA and Smart Wallet
      version: '4' // Use latest version
    }),
    farcasterMiniApp()
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [celo.id]: http(),
    [base.id]: http(),
  },
}

// Create Wagmi Adapter for AppKit
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false // Set to false for Vite/SPA
})

// Create AppKit instance with all features enabled
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  defaultNetwork: base,
  metadata: {
    name: 'Zyn Prediction Markets',
    description: 'Zyn - Create and trade prediction markets',
    url: import.meta.env.DEV ? 'http://localhost:5173' : 'https://zyn.com',
    icons: ['https://zyn.com/logo.png']
  },
  featuredWalletIds: [
    "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // Coinbase Wallet
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
    "d01c7758d741b363e637a817a09bcf579feae4db9f5bb16f599fdd1f66e2f974", // WalletConnect
  ],
  features: {
    analytics: true,
    // Enable all authentication features by default
    email: true,
    socials: [
      "google",
      "x", 
      "github",
      "discord",
      "apple",
      "facebook",
      "farcaster",
    ],
    emailShowWallets: true,
  },
  // Show all wallets
  allWallets: "SHOW",
  // Set theme to light
  themeMode: "light"
})

// Export the wagmi config for direct use
export const wagmiConfig = wagmiAdapter.wagmiConfig
