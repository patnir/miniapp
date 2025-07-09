import { useState, useEffect, useCallback } from 'react';
import { VerificationStatus } from '../app/types';
import { api } from '../app/api';

export function useVerificationStatus(address: string | null) {
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