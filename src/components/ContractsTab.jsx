import { useState } from "react";

export default function ContractsTab() {
  const [form, setForm] = useState({
    customer: "",
    address: "",
    phone: "",
    email: "",
    services: "",
    startDate: "",
    deposit: "",
    total: "",
    payments: [],
    notes: ""
  });

  const [payDue, setPayDue] = useState("");
  const [payAmt, setPayAmt] = useState("");

  const addPayment = () => {
    if (!payDue || !payAmt) return;
    setForm({
      ...form,
      payments: [...form.payments, { due: payDue, amount: payAmt }]
    });
    setPayDue("");
    setPayAmt("");
  };

  return (
    <div>
      <h2>Service Agreement Contract</h2>

      <input placeholder="Customer Name" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} style={input} />
      <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={input} />
      <input placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={input} />
      <input placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={input} />
      <input type="date" placeholder="Start Date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={input} />
      <textarea placeholder="Describe Services Provided" value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} style={{ ...input, height: "80px" }} />
      <input placeholder="Deposit Amount" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} style={input} />
      <input placeholder="Total Price" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} style={input} />

      <h4>Add Payment Schedule</h4>
      <input placeholder="Due Date" value={payDue} onChange={(e) => setPayDue(e.target.value)} style={input} />
      <input placeholder="Amount" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} style={input} />
      <button onClick={addPayment} style={button}>Add Payment</button>

      <h4>Payment Schedule</h4>
      <ul>
        {form.payments.map((p, idx) => (
          <li key={idx}>{p.due} — ${p.amount}</li>
        ))}
      </ul>

      <textarea placeholder="Additional Notes or Terms" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...input, height: "60px" }} />

      <div style={{ marginTop: "2rem", background: "#222", padding: "1rem", borderRadius: "10px", color: "white" }}>
        <h3>Agreement Preview</h3>
        <p><strong>Customer:</strong> {form.customer}</p>
        <p><strong>Address:</strong> {form.address}</p>
        <p><strong>Contact:</strong> {form.phone} | {form.email}</p>
        <p><strong>Start Date:</strong> {form.startDate}</p>
        <p><strong>Services:</strong> {form.services}</p>
        <p><strong>Total:</strong> ${form.total} | <strong>Deposit:</strong> ${form.deposit}</p>
        <h4>Payment Schedule:</h4>
        <ul>
          {form.payments.map((p, idx) => (
            <li key={idx}>{p.due} — ${p.amount}</li>
          ))}
        </ul>
        <p><strong>Notes:</strong> {form.notes}</p>

        <div style={{ marginTop: "2rem" }}>
          <h4>Terms and Conditions</h4>
          <p>
            This service agreement outlines the scope of work, service frequency, payment schedule, and terms between Bowen Mechanical and the above-named customer. All service and labor performed shall comply with state and local code. The customer agrees to allow access to all relevant systems during scheduled maintenance or installation. Any damage resulting from inaccessible equipment, hazardous conditions, or non-disclosure of prior issues is the responsibility of the customer.
          </p>
          <p>
            Bowen Mechanical provides a limited workmanship warranty on all installed parts and equipment for a period of 1 year from the date of completion. Manufacturer warranties may extend beyond this period as applicable. This contract does not cover damage caused by neglect, misuse, fire, flood, natural disasters, power surges, or acts of God.
          </p>
          <p>
            All deposits are non-refundable once materials have been purchased. Final payment is due upon completion unless otherwise specified. Late or missed payments may result in stoppage of work or legal action.
          </p>
          <p>
            The customer acknowledges they have read and understood this agreement and agree to all terms as listed.
          </p>
        </div>

        <p style={{ marginTop: "2rem" }}>__________________________<br />Customer Signature</p>
        <p style={{ marginTop: "2rem" }}>__________________________<br />Technician Signature</p>
      </div>
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
  borderRadius: "5px",
  marginBottom: "1rem"
};
