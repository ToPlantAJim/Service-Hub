import { useState } from "react";
import { QrReader } from "react-qr-reader";

export default function QRScanner({ onScanSuccess }) {
  const [scanResult, setScanResult] = useState("");

  return (
    <div style={{ marginTop: "1rem" }}>
      <QrReader
        constraints={{ facingMode: "environment" }}
        onResult={(result, error) => {
          if (!!result) {
            setScanResult(result?.text);
            onScanSuccess(result?.text);
          }
        }}
        style={{ width: "100%" }}
      />
      <p style={{ marginTop: "10px", color: "white" }}>
        {scanResult ? `Scanned: ${scanResult}` : "Waiting for scan..."}
      </p>
    </div>
  );
}
