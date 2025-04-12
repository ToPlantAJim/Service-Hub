import React, { useEffect, useState } from 'react';
import QrReader from 'react-qr-scanner';

const QRScanner = ({ onScan }) => {
  const [scannedData, setScannedData] = useState(null);

  const handleScan = (data) => {
    if (data && data.text !== scannedData) {
      setScannedData(data.text);
      onScan(data.text); // Pass scanned QR data to parent
    }
  };

  const handleError = (err) => {
    console.error('QR Scan Error:', err);
  };

  const previewStyle = {
    height: 240,
    width: 320,
    border: '2px solid #00ff99',
    marginBottom: '10px'
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Scan QR Code</h2>
      <QrReader
        delay={300}
        onError={handleError}
        onScan={handleScan}
        style={previewStyle}
      />
      {scannedData && (
        <p>
          ✅ Scanned: <strong>{scannedData}</strong>
        </p>
      )}
    </div>
  );
};

export default QRScanner;
