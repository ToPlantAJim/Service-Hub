import { useState } from "react";
import QRScanner from "./QRScanner";

export default function ServiceTrailTab({ inventory, onUsePart }) {
  const [job, setJob] = useState("");
  const [usedItem, setUsedItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [log, setLog] = useState([]);
  const [showScanner, setShowScanner] = useState(false);

  const handleLog = () => {
    if (!job || !usedItem || quantity <= 0) return;
    const entry = {
      job,
      item: usedItem,
      quantity,
      date: new Date().toLocaleString()
    };
    setLog([entry, ...log]);
    onUsePart({ name: usedItem, quantity });
    setUsedItem("");
    setQuantity(1);
    setJob("");
  };

  return (
    <div>
      <h2>Service Trail</h2>

      <button
        onClick={() => setShowScanner(!showScanner)}
        style={{
          padding: "0.5rem",
          backgroundColor: "#2196F3",
          color: "white",
          border: "none",
          borderRadius: "5px",
          marginBottom: "1rem"
        }}
      >
        {showScanner ? "Close Scanner" : "Scan QR"}
      </button>

      {showScanner && (
        <QRScanner
          onScanSuccess={(text) => {
            const partName = text.split(" - ")[0]; // Assumes "PartName - Quantity"
            setUsedItem(partName);
            setQuantity(1);
            setShowScanner(false);
          }}
        />
      )}

      <input
        placeholder="Job Name"
        value={job}
        onChange={(e) => setJob(e.target.value)}
        style={inputStyle}
      />

      <select
        value={usedItem}
        onChange={(e) => setUsedItem(e.target.value)}
        style={inputStyle}
      >
        <option value="">-- Select Item --</option>
        {inventory.map((item, idx) => (
          <option key={idx} value={item.name}>
            {item.name}
          </option>
        ))}
      </select>

      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value))}
        style={inputStyle}
      />

      <button onClick={handleLog} style={buttonStyle}>
        Log Usage
      </button>

      <ul style={{ marginTop: "1rem" }}>
        {log.map((entry, idx) => (
          <li key={idx}>
            {entry.date}: Used {entry.quantity}x {entry.item} on {entry.job}
          </li>
        ))}
      </ul>
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  marginBottom: "0.5rem",
  padding: "0.5rem",
  backgroundColor: "#222",
  color: "white",
  border: "none",
  borderRadius: "5px"
};

const buttonStyle = {
  padding: "0.5rem 1rem",
  backgroundColor: "#F44336",
  color: "white",
  border: "none",
  borderRadius: "5px"
};
