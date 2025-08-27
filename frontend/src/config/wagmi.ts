import { http, createConfig } from 'wagmi'
import { celoAlfajores, base } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [celoAlfajores, base],
  connectors: [injected(), metaMask()],
  transports: {
    [celoAlfajores.id]: http(),
    [base.id]: http(),
  },
})
