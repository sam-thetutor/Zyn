import { cookieStorage, createStorage, http } from '@wagmi/core'
import { celo, base } from '@reown/appkit/networks'
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector"
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import type { Config } from 'wagmi'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { coinbaseWallet } from 'wagmi/connectors'
import { config as envConfig } from './env'

// Get projectId from environment
export const projectId = envConfig.walletConnectProjectId

if (!projectId || projectId === 'your-project-id') {
  console.warn('WalletConnect Project ID not set. Please set VITE_WALLETCONNECT_PROJECT_ID in your environment variables.')
}

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [base, celo] // Base first, then Celo

// Create base wagmi config with only Farcaster
export const baseWagmiConfig = {
  chains: networks,
  connectors: [
    coinbaseWallet({
      appName: 'Zyn',
      appLogoUrl: `${envConfig.appUrl}/logo.png`,
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
  ssr: false // Vite doesn't use SSR
})

// Create AppKit instance with all features enabled
// The conditional logic will be handled in the UI components
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  defaultNetwork: base,
  metadata: {
    name: 'Zyn',
    description: 'Zyn - Prediction Markets Platform',
    url: envConfig.appUrl,
    icons: [`${envConfig.appUrl}/logo.png`]
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
  // Set theme to white
  themeMode: "light"
})

// Export the wagmi config for direct use
export const wagmiConfig: Config = wagmiAdapter.wagmiConfig as Config

// Export the appKit config for direct use
export const appKitConfig = appKit
