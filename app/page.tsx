'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { WalletOptions } from './wallet-options'
import { AccountWithVerification } from '../components/AccountWithVerification'

function ConnectWallet() {
  const { isConnected } = useAccount()
  if (isConnected) return <AccountWithVerification />
  return <WalletOptions />
}

export default function Home() {
  const [_, setReady] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    sdk.actions.ready().then(() => {
      console.log('ready')
      setReady(true)
    })
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          
          <h1 className="text-xl font-bold mb-2">Base Verify</h1>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Base Verify</h1>
          <p className="text-gray-600 text-sm">
            Verify your identity with trusted providers
          </p>
          <div className="text-gray-600 mb-2">
          <a href="https://verified-voting.vercel.app?ref=miniapp&v=1.2&t=1234567890" className="font-bold mb-2" target="_blank" rel="noopener noreferrer">
            Opens link (https://verified-voting.vercel.app?ref=miniapp&v=1.2&t=1234567890)
          </a>
          </div>
          <div className="text-gray-600 mb-2">
          <a href="cbwallet://miniapp?url=https://verified-voting.vercel.app?ref=deeplink&v=2.1&session=abc123" className="font-bold mb-2" target="_blank" rel="noopener noreferrer">
            Opens deep link (cbwallet://miniapp?url=https://verified-voting.vercel.app?ref=deeplink&v=2.1&session=abc123)
          </a>
          </div>
          <div className="text-gray-600 mb-2">
          <a href="https://wallet.coinbase.com/miniapp?url=https://verified-voting.vercel.app?ref=coinbase&v=3.0&uid=xyz789" className="font-bold mb-2" target="_blank" rel="noopener noreferrer">
            Opens in Coinbase Wallet (https://wallet.coinbase.com/miniapp?url=https://verified-voting.vercel.app?ref=coinbase&v=3.0&uid=xyz789)
          </a>
          </div>
        </div>
        
        <ConnectWallet />
      </div>
    </div>
  );
}
