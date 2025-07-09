import { VerificationStatus, SignatureData, RevokeAttestationRequest } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const api = {
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