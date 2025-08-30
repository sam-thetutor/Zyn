import { http, createConfig } from 'wagmi'
import { celo, base } from 'wagmi/chains'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

// Use the Farcaster Mini App connector directly
const embeddedWalletConnector = () => {
  return miniAppConnector()
}

export const config = createConfig({
  chains: [celo, base],
  connectors: [embeddedWalletConnector()],
  transports: {
    [celo.id]: http('https://forno.celo.org', {
      timeout: 30000, // 30 seconds
      retryCount: 3,
      retryDelay: 1000,
    }),
    [base.id]: http(),
  },
})
