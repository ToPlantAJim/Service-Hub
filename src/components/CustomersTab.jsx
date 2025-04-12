import { useState, useEffect } from "react";

export default function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    accountNumber: "",
    hasServiceAgreement: false,
    notes: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("hvac_customers");
    if (saved) setCustomers(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("hvac_customers", JSON.stringify(customers));
  }, [customers]);

  const addCustomer = () => {
    if (!form.name) return;
    setCustomers([form, ...customers]);
    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      accountNumber: "",
      hasServiceAgreement: false,
      notes: "",
    });
  };

  return (
    <div>
      <h2>Customer Management</h2>

      <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={input} />
      <input placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={input} />
      <input placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={input} />
      <input placeholder="Street Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={input} />
      <input placeholder="Account Number (if applicable)" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} style={input} />

      <label style={{ color: "white", display: "block", marginBottom: "0.5rem" }}>
        <input
          type="checkbox"
          checked={form.hasServiceAgreement}
          onChange={(e) => setForm({ ...form, hasServiceAgreement: e.target.checked })}
        />
        {" "}Has Service Agreement
      </label>

      <textarea placeholder="Notes or Job Info" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...input, height: "80px" }} />

      <button onClick={addCustomer} style={button}>Add Customer</button>

      <h4 style={{ marginTop: "2rem" }}>Saved Customers</h4>
      <ul>
        {customers.map((c, idx) => (
          <li key={idx} style={{ marginBottom: "1rem" }}>
            <strong>{c.name}</strong> {c.hasServiceAgreement && "(Service Agreement ✅)"}<br />
            {c.phone} | {c.email}<br />
            {c.address}<br />
            {c.accountNumber && <>Acct #: {c.accountNumber}<br /></>}
            Notes: {c.notes}
          </li>
        ))}
      </ul>
    </div>
  );
}

const input = {
  display: "block",
  width: "100%",
  marginBottom: "0.5rem",
  padding: "0.5rem",
  backgroundColor: "#222",
  color: "white",
  border: "none",
  borderRadius: "5px"
};

const button = {
  padding: "0.5rem 1rem",
  backgroundColor: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "5px"
};
