import { useRef } from "react";

export default function SignatureCanvas({ onSign }) {
  const canvasRef = useRef(null);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    canvas.isDrawing = true;
  };

  const draw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas.isDrawing) return;
    const ctx = canvas.getContext("2d");
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const endDrawing = () => {
    const canvas = canvasRef.current;
    canvas.isDrawing = false;
    const dataUrl = canvas.toDataURL();
    onSign(dataUrl);
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <canvas
        ref={canvasRef}
        width={300}
        height={100}
        style={{ border: "1px solid white", backgroundColor: "#333" }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
      />
    </div>
  );
}
