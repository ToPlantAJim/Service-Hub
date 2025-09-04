// src/components/ScanModal.jsx
import React, { useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function ScanModal({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    (async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const deviceId = devices?.[0]?.deviceId;
        await codeReader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
          if (result) {
            onDetected(result.getText());
          }
        });
      } catch (e) {
        console.error(e);
        alert("Camera/scan error. Check permissions.");
      }
    })();

    return () => {
      try { codeReader.reset(); } catch {}
    };
  }, [open, onDetected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center">
      <div className="card p-4 w-[min(95vw,720px)]">
        <h3 className="text-lg font-semibold mb-3">Scan Item (QR)</h3>
        <video ref={videoRef} className="w-full rounded-xl bg-black" muted playsInline />
        <div className="mt-4 flex justify-end">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
