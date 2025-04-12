import { useState } from "react";

export default function InvoicesTab() {
  const [customer, setCustomer] = useState("");
  const [job, setJob] = useState("");
  const [items, setItems] = useState([]);
  const [tax, setTax] = useState(0);

  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");

  const addItem = () => {
    if (!desc || !price) return;
    setItems([...items, { desc, price: parseFloat(price) }]);
    setDesc("");
    setPrice("");
  };

  const subtotal = items.reduce((acc, item) => acc + item.price, 0);
  const total = subtotal + parseFloat(tax || 0);

  return (
    <div>
      <h2>Create Invoice</h2>

      <input placeholder="Customer Name" value={customer} onChange={(e) => setCustomer(e.target.value)} style={inputStyle} />
      <input placeholder="Job Description" value={job} onChange={(e) => setJob(e.target.value)} style={inputStyle} />

      <h4>Add Line Item</h4>
      <input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} style={inputStyle} />
      <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} />
      <button onClick={addItem} style={buttonStyle}>Add Line</button>

      <input type="number" placeholder="Tax (optional)" value={tax} onChange={(e) => setTax(e.target.value)} style={inputStyle} />

      <h4 style={{ marginTop: "1rem" }}>Invoice Preview</h4>
      <div style={{ background: "#222", padding: "1rem", borderRadius: "10px", color: "white" }}>
        <p><strong>Customer:</strong> {customer}</p>
        <p><strong>Job:</strong> {job}</p>
        <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>

        <ul>
          {items.map((item, idx) => (
            <li key={idx}>{item.desc} — ${item.price.toFixed(2)}</li>
          ))}
        </ul>

        <p><strong>Subtotal:</strong> ${subtotal.toFixed(2)}</p>
        <p><strong>Tax:</strong> ${parseFloat(tax).toFixed(2)}</p>
        <h3>Total: ${total.toFixed(2)}</h3>
      </div>
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
  borderRadius: "5px",
  marginBottom: "1rem"
};
