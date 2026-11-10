import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRGeneratorProps {
  value: string;
  size?: number;
  customerName?: string;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({
  value,
  size = 220,
  customerName,
}) => {
  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="p-2 bg-white rounded-xl">
        <QRCodeSVG
          value={value}
          size={size}
          level="H"
          includeMargin={false}
          imageSettings={undefined}
        />
      </div>
      {customerName && (
        <span className="mt-3 text-xs font-semibold text-slate-700 tracking-wide uppercase">
          {customerName}
        </span>
      )}
      <span className="mt-1 text-[10px] font-mono text-slate-600 truncate max-w-[200px]">
        {value}
      </span>
    </div>
  );
};
