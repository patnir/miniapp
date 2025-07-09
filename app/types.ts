export interface VerificationStatus {
  isVerified: boolean;
  verifications: Array<{
    id: string;
    provider: string;
    created_at: string;
    revoked_at: string | null;
    provider_info?: any;
  }>;
}

export interface SignatureData {
  message: string;
  signature: string;
  timestamp: number;
}

export interface RevokeAttestationRequest {
  address: string;
  provider: string;
  signature: string;
  message: string;
  timestamp: number;
}