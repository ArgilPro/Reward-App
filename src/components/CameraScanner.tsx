import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Sparkles } from 'lucide-react';

interface CameraScannerProps {
  onScan: (decodedText: string) => void;
  onCancel: () => void;
  targetCustomerUuid?: string;
  targetCustomerName?: string;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScan,
  onCancel,
  targetCustomerUuid,
  targetCustomerName,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'qr-reader-viewport';

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        setPermissionError(null);
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setPermissionError('No camera devices detected on this device.');
          return;
        }

        html5QrCode = new Html5Qrcode(qrRegionId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          (decodedText) => {
            if (decodedText) {
              html5QrCode?.stop().then(() => {
                setCameraActive(false);
                onScan(decodedText);
              }).catch(() => {
                onScan(decodedText);
              });
            }
          },
          () => {}
        );
        setCameraActive(true);
      } catch (err: any) {
        console.warn('Camera start issue:', err);
        setPermissionError(
          err.message?.includes('Permission')
            ? 'Camera permission denied. Please allow camera access in browser settings or use manual verify.'
            : 'Unable to start camera video stream.'
        );
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  const handleSimulateScanTarget = () => {
    if (targetCustomerUuid) {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      onScan(targetCustomerUuid);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900 p-4 justify-between select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          onClick={onCancel}
          className="text-sm font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <span className="text-sm font-extrabold tracking-tight text-[#0B1E3B]">Scan Customer QR</span>
        <div className="w-12" />
      </div>

      {/* Main Scanner Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center my-2 relative">
        <div className="relative w-[260px] h-[260px] bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-300 flex items-center justify-center shadow-inner">
          {/* HTML5 QR Code Mount Node */}
          <div id={qrRegionId} className="w-full h-full object-cover" />

          {/* Viewfinder Reticle Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Corners: Dark Navy */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-[#0B1E3B] rounded-tl-lg" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-[#0B1E3B] rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-[#0B1E3B] rounded-bl-lg" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-[#0B1E3B] rounded-br-lg" />

            {/* Scanning Line Animation */}
            <div className="w-48 h-0.5 bg-[#0B1E3B] shadow-[0_0_10px_rgba(11,30,59,0.5)] animate-bounce" />
          </div>

          {!cameraActive && (
            <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
              <Camera className="w-10 h-10 text-slate-400 mb-2 animate-pulse" />
              <span className="text-xs text-slate-500 font-medium">
                {permissionError || 'Initializing Camera...'}
              </span>
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-500 text-center max-w-[260px]">
          Point camera at the customer&apos;s loyalty QR code
        </p>

        {/* Demo Fast Scan Button if target customer available */}
        {targetCustomerUuid && (
          <button
            onClick={handleSimulateScanTarget}
            className="mt-3 px-3.5 py-2 bg-[#0B1E3B] hover:bg-[#071326] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0B1E3B]/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Instant Scan: {targetCustomerName || 'John Doe'}</span>
          </button>
        )}
      </div>

      {/* Manual Code Input / Fallback */}
      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 shadow-2xs">
        <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
          Or Enter Customer ID manually:
        </span>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="e.g. a1111111-1111-4111-8111-111111111111"
            className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B1E3B]"
          />
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="px-3.5 py-2 bg-[#0B1E3B] hover:bg-[#071326] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            Verify
          </button>
        </form>
      </div>
    </div>
  );
};
