'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { useEffect, useState, useCallback } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { signMessage } from '@wagmi/core'
import { config } from './config'
import { WalletOptions } from './wallet-options'
import { QRCodeSVG } from 'qrcode.react'

// Types and interfaces
interface VerificationStatus {
  isVerified: boolean;
  verifications: Array<{
    id: string;
    provider: string;
    created_at: string;
    revoked_at: string | null;
    provider_info?: any;
  }>;
}

interface SignatureData {
  message: string;
  signature: string;
  timestamp: number;
}

interface RevokeAttestationRequest {
  address: string;
  provider: string;
  signature: string;
  message: string;
  timestamp: number;
}

// API service functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const api = {
  async getVerificationStatus(address: string): Promise<VerificationStatus> {
    const response = await fetch(`${API_BASE_URL}/verify/status/${encodeURIComponent(address)}`, {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch verification status');
    }

    const jsonResponse = await response.json();
    return jsonResponse.data;
  },

  async getSelfQr(address: string, signatureData: SignatureData): Promise<{ url: string }> {
    const response = await fetch(`${API_BASE_URL}/verify/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        address,
        ...signatureData,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Self verification URL');
    }

    return response.json();
  },

  async revokeAttestation(request: RevokeAttestationRequest): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/verify/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to revoke attestation');
    }

    return result;
  },

  getCoinbaseVerificationUrl(address: string): string {
    return `${API_BASE_URL}/verify/cb/start?address=${encodeURIComponent(address)}`;
  },

  getXVerificationUrl(address: string): string {
    return `${API_BASE_URL}/verify/x/start?address=${encodeURIComponent(address)}`;
  },
};

// Verification Status Hook
function useVerificationStatus(address: string | null) {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const response = await api.getVerificationStatus(address);
      const statusWithStringDates: VerificationStatus = {
        isVerified: response.isVerified,
        verifications: response.verifications.map(v => ({
          ...v,
          created_at: typeof v.created_at === 'string' ? v.created_at : new Date(v.created_at).toISOString(),
          revoked_at: v.revoked_at ? (typeof v.revoked_at === 'string' ? v.revoked_at : new Date(v.revoked_at).toISOString()) : null
        }))
      };
      setStatus(statusWithStringDates);
    } catch (error) {
      console.error('Error fetching verification status:', error);
      setStatus({ isVerified: false, verifications: [] });
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, loading, refetch: fetchStatus };
}

// Verification Status Component
function VerificationStatusCard({ address }: { address: string }) {
  const { status, loading, refetch } = useVerificationStatus(address);
  const [revokingStates, setRevokingStates] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleRevoke = async (verificationId: string, provider: string) => {
    setRevokingStates(prev => ({ ...prev, [verificationId]: true }));
    setNotification(null);

    try {
      const timestamp = Date.now();
      const message = `Revoke attestation for ${address.toLowerCase()} on ${provider} at ${timestamp}`;
      const signature = await signMessage(config, { message });

      const request: RevokeAttestationRequest = {
        address,
        provider,
        signature,
        message,
        timestamp,
      };

      const result = await api.revokeAttestation(request);

      if (result.status === 'success') {
        setNotification({ type: 'success', message: 'Attestation revoked successfully!' });
        refetch();
      } else {
        setNotification({ type: 'error', message: result.message || 'Failed to revoke attestation' });
      }
    } catch (error) {
      console.error('Error revoking attestation:', error);
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to revoke attestation' 
      });
    } finally {
      setRevokingStates(prev => ({ ...prev, [verificationId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <p className="text-sm">Checking verification status...</p>
        </div>
      </div>
    );
  }

  const isVerified = status?.isVerified || false;
  const activeVerifications = status?.verifications.filter(v => !v.revoked_at) || [];

  return (
    <div className="p-4 border rounded-lg bg-white">
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-3 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-green-100 border-green-300 text-green-800'
            : 'bg-red-100 border-red-300 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 text-sm hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Status Header with Refresh Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            isVerified ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {isVerified ? (
              <span className="text-white text-sm">✓</span>
            ) : (
              <span className="text-white text-sm">×</span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg">
              {isVerified ? 'Verified' : 'Not Verified'}
            </h3>
            <p className="text-sm text-gray-600">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={refetch}
          disabled={loading}
          className={`p-2 rounded-md border transition-colors ${
            loading 
              ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
              : 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
          }`}
          title="Refresh verification status"
        >
          <svg 
            className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </button>
      </div>

      {/* Active Verifications */}
      {isVerified && activeVerifications.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-800">Active Verifications:</p>
          {activeVerifications.map((verification) => (
            <div 
              key={verification.id}
              className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">{verification.provider}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500">
                    {new Date(verification.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => handleRevoke(verification.id, verification.provider)}
                disabled={revokingStates[verification.id]}
                className={`px-3 py-1 text-xs font-medium rounded-md ${
                  revokingStates[verification.id]
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {revokingStates[verification.id] ? 'Revoking...' : 'Revoke'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Provider Verification Component
function ProviderVerificationButtons({ address }: { address: string }) {
  const [selfLoading, setSelfLoading] = useState(false);
  const [selfUrl, setSelfUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSelfVerification = async () => {
    setSelfLoading(true);
    setError('');
    
    try {
      const timestamp = Date.now();
      const message = `Verify ownership of ${address} for Self.xyz verification at ${timestamp}`;
      const signature = await signMessage(config, { message });
      
      const response = await api.getSelfQr(address, {
        message,
        signature,
        timestamp
      });
      
      setSelfUrl(response.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Self verification');
    } finally {
      setSelfLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg">Verify with Identity Providers</h3>
      
      {/* Self.xyz */}
      <div className="p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium">Self.xyz</h4>
            <p className="text-sm text-gray-600">Verify your identity using Self.xyz</p>
          </div>
          <button
            onClick={handleSelfVerification}
            disabled={selfLoading}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              selfLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {selfLoading ? 'Loading...' : 'Verify'}
          </button>
        </div>
        
        {selfUrl && (
          <div className="space-y-3">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                <QRCodeSVG
                  value={selfUrl}
                  size={150}
                  bgColor="white"
                  fgColor="black"
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>
            
            {/* URL Link */}
            <div className="text-xs p-3 bg-white rounded border">
              <p className="text-gray-600 mb-2">Or open this link directly:</p>
              <a 
                href={selfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Open Self.xyz Verification
              </a>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Coinbase */}
      <div className="p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium">Coinbase</h4>
            <p className="text-sm text-gray-600">Verify using Coinbase verification</p>
          </div>
          <a
            href={api.getCoinbaseVerificationUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white"
          >
            Verify
          </a>
        </div>
      </div>

      {/* X (Twitter) */}
      <div className="p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium">X (Twitter)</h4>
            <p className="text-sm text-gray-600">Verify using your X account</p>
          </div>
          <a
            href={api.getXVerificationUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium rounded-md bg-black hover:bg-gray-800 text-white"
          >
            Verify
          </a>
        </div>
      </div>
    </div>
  );
}

// Account component with verification
function AccountWithVerification() {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()

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
  )
}

function ConnectWallet() {
  const { isConnected } = useAccount()
  if (isConnected) return <AccountWithVerification />
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
