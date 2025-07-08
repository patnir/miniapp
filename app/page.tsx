'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { useEffect, useState } from 'react'
import { Profile } from './profile'
import { useAccount } from 'wagmi'
import { Account } from './account'
import { WalletOptions } from './wallet-options'

function ConnectWallet() {
  const { isConnected } = useAccount()
  if (isConnected) return <Account />
  return <WalletOptions />
}

export default function Home() {
  const [ready, setReady] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    sdk.actions.ready().then(() => {
      console.log('ready')
      setReady(true)
    })
  }, [])

  // Prevent hydration mismatch by showing same content on server and client initially
  if (!mounted) {
    return (
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <h1>Hello World...</h1>
          <div>Loading...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1>Hello World {ready ? 'ready' : 'not ready'}</h1>
        <ConnectWallet />
      </main>
    </div>
  );
}
