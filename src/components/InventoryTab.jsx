import { useState, useEffect } from "react";
import QRCodeDisplay from "./QRCodeDisplay";

export default function InventoryTab({ inventory, setInventory }) {
  const [form, setForm] = useState({
    name: "",
    quantity: 0,
    supplier: "",
    orderNumber: "",
    cost: "",
    markup: "",
  });

  const [showQR, setShowQR] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("hvac_inventory");
    if (saved) setInventory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("hvac_inventory", JSON.stringify(inventory));
  }, [inventory]);

  const addItem = () => {
    if (!form.name || form.quantity <= 0) return;

    const cost = parseFloat(form.cost) || 0;
    const markup = parseFloat(form.markup) || 0;
    const retail = cost + (cost * (markup / 100));
    const profit = retail - cost;
    const margin = retail > 0 ? (profit / retail) * 100 : 0;

    const newItem = {
      ...form,
      cost,
      markup,
      retail: retail.toFixed(2),
      profit: profit.toFixed(2),
      margin: margin.toFixed(2),
    };

    const exists = inventory.find((i) => i.name === form.name);
    if (exists) {
      const updated = inventory.map((i) =>
        i.name === form.name ? { ...i, quantity: i.quantity + form.quantity } : i
      );
      setInventory(updated);
    } else {
      setInventory([newItem, ...inventory]);
    }

    setForm({
      name: "",
      quantity: 0,
      supplier: "",
      orderNumber: "",
      cost: "",
      markup: "",
    });
  };

  return (
    <div>
      <h2>Inventory Manager + Pricing</h2>

      <input placeholder="Part name" value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        style={inputStyle} />

      <input type="number" placeholder="Quantity" value={form.quantity}
        onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
        style={inputStyle} />

      <input placeholder="Supplier / Vendor" value={form.supplier}
        onChange={(e) => setForm({ ...form, supplier: e.target.value })}
        style={inputStyle} />

      <input placeholder="Order Number" value={form.orderNumber}
        onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
        style={inputStyle} />

      <input type="number" placeholder="Cost Price" value={form.cost}
        onChange={(e) => setForm({ ...form, cost: e.target.value })}
        style={inputStyle} />

      <input type="number" placeholder="Markup %" value={form.markup}
        onChange={(e) => setForm({ ...form, markup: e.target.value })}
        style={inputStyle} />

      <button onClick={addItem} style={buttonStyle}>Add Item</button>

      <ul style={{ marginTop: "1rem" }}>
        {inventory.map((item, idx) => (
          <li key={idx} style={{ marginBottom: "1.5rem" }}>
            <strong>{item.name}</strong> — {item.quantity} in stock<br />
            Supplier: {item.supplier || "N/A"} | Order #: {item.orderNumber || "N/A"}<br />
            Cost: ${item.cost} | Markup: {item.markup}%<br />
            Retail: ${item.retail} | Profit: ${item.profit} | Margin: {item.margin}%
            <br />
            <button
              onClick={() => setShowQR(showQR === item.name ? null : item.name)}
              style={qrBtn}
            >
              {showQR === item.name ? "Hide QR" : "View QR"}
            </button>
            {showQR === item.name && (
              <QRCodeDisplay text={`${item.name} - $${item.retail}`} />
            )}
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
  backgroundColor: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "5px"
};

const qrBtn = {
  marginTop: "0.5rem",
  padding: "4px 8px",
  backgroundColor: "#555",
  color: "white",
  border: "none",
  borderRadius: "5px"
};
