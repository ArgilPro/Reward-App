import React, { useState } from 'react';
import { CustomerSummary } from '../../types';
import { merchantService } from '../../services/merchant';
import { CameraScanner } from '../components/CameraScanner';
import { AlertCircle } from 'lucide-react';

interface MerchantScanViewProps {
  onCustomerIdentified: (customer: CustomerSummary) => void;
  onCancel: () => void;
  targetCustomerUuid?: string;
  targetCustomerName?: string;
}

export const MerchantScanView: React.FC<MerchantScanViewProps> = ({
  onCustomerIdentified,
  onCancel,
  targetCustomerUuid,
  targetCustomerName,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleScan = async (scannedPayload: string) => {
    if (isVerifying) return;
    setIsVerifying(true);
    setError(null);

    try {
      const customer = await merchantService.verifyCustomer(scannedPayload);
      onCustomerIdentified(customer);
    } catch (err: any) {
      setError(err.message || 'Invalid customer QR code.');
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Error alert toast if invalid scan */}
      {error && (
        <div className="absolute top-14 left-4 right-4 z-50 p-3 bg-red-600/95 text-white rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-white" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-black/20 hover:bg-black/30"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Camera scanner with viewfinder & manual input */}
      <CameraScanner
        onScan={handleScan}
        onCancel={onCancel}
        targetCustomerUuid={targetCustomerUuid}
        targetCustomerName={targetCustomerName}
      />
    </div>
  );
};
