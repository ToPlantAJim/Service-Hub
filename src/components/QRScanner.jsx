// src/components/QRScanner.jsx
import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const QRScanner = ({ onScan }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear(); // Stop scanner after successful scan
      },
      (error) => {
        console.warn("QR Scan error:", error);
      }
    );

    return () => {
      scanner.clear().catch((err) => console.error("Cleanup error:", err));
    };
  }, [onScan]);

  return <div id="qr-reader" />;
};

export default QRScanner;
