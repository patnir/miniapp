import { useState } from 'react'
import { signMessage } from '@wagmi/core'
import { config } from './config'

export function SignMessageComponent({ message, onSignatureGenerated }: { message: string, onSignatureGenerated: (signature: string) => void }) {
  const [signature, setSignature] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignMessage = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const sig = await signMessage(config, {
        message: message,
      })
      setSignature(sig)
      onSignatureGenerated(sig)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign message')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <p>Message to sign: {message}</p>
      <button onClick={handleSignMessage} disabled={isLoading}>
        {isLoading ? 'Signing...' : 'Sign Message'}
      </button>
      {signature && (
        <div>
          <p>Signature:</p>
          <code>{signature}</code>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  )
}