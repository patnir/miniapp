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
        </div>
        
        <ConnectWallet />
      </div>
    </div>
  );
}
