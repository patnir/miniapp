import { useAccount, useDisconnect } from 'wagmi';
import { VerificationStatusCard } from './VerificationStatusCard';
import { ProviderVerificationButtons } from './ProviderVerificationButtons';

export function AccountWithVerification() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Wallet Info */}
      <div className="p-4 border rounded-lg bg-white">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-2">
            <p className="text-sm font-medium">Connected Wallet</p>
            <p className="text-xs text-gray-600 break-all">{address}</p>
          </div>
          <button 
            onClick={() => disconnect()}
            className="p-2 rounded-md border bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors"
            title="Disconnect wallet"
          >
            <svg 
              className="w-4 h-4 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Verification Status */}
      {address && <VerificationStatusCard address={address} />}

      {/* Provider Verification */}
      {address && <ProviderVerificationButtons address={address} />}
    </div>
  );
}