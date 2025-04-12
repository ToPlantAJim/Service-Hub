import { QRCodeCanvas } from "qrcode.react";

export default function QRCodeDisplay({ text }) {
  const downloadQR = () => {
    const canvas = document.getElementById(`qr-${text}`);
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${text}.png`;
    downloadLink.click();
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <QRCodeCanvas
        id={`qr-${text}`}
        value={text}
        size={128}
        bgColor="#ffffff"
        fgColor="#000000"
        level={"H"}
        includeMargin={true}
      />
      <button onClick={downloadQR} style={{ marginTop: "10px", padding: "5px", backgroundColor: "#333", color: "white", borderRadius: "5px" }}>
        Download QR
      </button>
    </div>
  );
}
