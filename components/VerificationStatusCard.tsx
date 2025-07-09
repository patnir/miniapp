import { useState } from 'react';
import { signMessage } from '@wagmi/core';
import { config } from '../app/config';
import { useVerificationStatus } from '../hooks/useVerificationStatus';
import { RevokeAttestationRequest } from '../app/types';
import { api } from '../app/api';

export function VerificationStatusCard({ address }: { address: string }) {
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