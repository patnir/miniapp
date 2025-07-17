import { http, createConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
// import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

export const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  connectors: [
    // miniAppConnector()
  ]
})