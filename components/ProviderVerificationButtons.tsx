import { useState } from 'react';
import { signMessage } from '@wagmi/core';
import { QRCodeSVG } from 'qrcode.react';
import { config } from '../app/config';
import { SignatureData } from '../app/types';
import { api } from '../app/api';

export function ProviderVerificationButtons({ address }: { address: string }) {
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