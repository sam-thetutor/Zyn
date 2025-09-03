import { http, createConfig } from 'wagmi'
import { celo, base } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'
import envConfig from './env'

export const config = createConfig({
  chains: [celo, base],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: envConfig.walletConnectProjectId,
    }),
  ],
  transports: {
    [celo.id]: http(),
    [base.id]: http(),
  },
  ssr: false,
})


