'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useState, useRef } from 'react';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  title?: string;
}

export function QRCodeDisplay({
  url,
  size = 256,
  title = 'Payment Link QR Code',
}: QRCodeDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // Find the SVG element
      const svgElement = qrCodeRef.current?.querySelector('svg') as SVGElement;
      if (!svgElement) {
        alert('QR code not found. Please try again.');
        setIsDownloading(false);
        return;
      }

      // Get SVG as string
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Create canvas to convert SVG to PNG
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);

          // Download as PNG
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `payment-link-qr-code-${Date.now()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }
          }, 'image/png');
        }
        URL.revokeObjectURL(svgUrl);
        setIsDownloading(false);
      };
      img.onerror = () => {
        alert('Failed to download QR code. Please try again.');
        setIsDownloading(false);
        URL.revokeObjectURL(svgUrl);
      };
      img.src = svgUrl;
    } catch (error) {
      alert('Failed to download QR code. Please try again.');
      setIsDownloading(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    alert('Payment URL copied to clipboard!');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

        {/* QR Code */}
        <div
          ref={qrCodeRef}
          className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4"
        >
          <QRCodeSVG
            value={url}
            size={size}
            level="M"
            includeMargin={true}
            className="block"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isDownloading ? 'Downloading...' : 'Download QR Code'}
          </button>
          <button
            onClick={handleCopyUrl}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 font-medium text-sm"
          >
            Copy URL
          </button>
        </div>

        {/* Instructions */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          Scan this QR code to open the payment link on your mobile device
        </p>
      </div>
    </div>
  );
}
