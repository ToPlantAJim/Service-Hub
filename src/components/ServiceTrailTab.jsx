import { useContext, useState }               from "react";
import { InventoryContext }                  from "../contexts/InventoryContext";
import { CustomerContext }                   from "../contexts/CustomerContext";
import { InvoiceContext }                    from "../contexts/InvoiceContext";

export default function ServiceTrailTab() {
  const { inventory, useItem }       = useContext(InventoryContext);
  const { customers, addCustomer }   = useContext(CustomerContext);
  const { logInvoice }               = useContext(InvoiceContext);

  const [job, setJob]                = useState("");
  const [custId, setCustId]          = useState("");
  const [newCust, setNewCust]        = useState({ name: "", phone: "" });
  const [partId, setPartId]          = useState("");
  const [qty, setQty]                = useState(1);
  const [price, setPrice]            = useState(0);
  const [lines, setLines]            = useState([]);

  const addLine = () => {
    const part = inventory.find(p => p.id === partId);
    setLines(l => [...l, { ...part, qty, price }]);
    useItem(partId, qty);
    setQty(1); setPrice(0);
  };

  const finishInvoice = () => {
    const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const tax      = parseFloat((subtotal * 0.07).toFixed(2));
    const total    = subtotal + tax;
    logInvoice({
      id: `inv_${Date.now()}`,
      job,
      customerId: custId,
      customerName: customers.find(c => c.id === custId)?.name || "",
      date: new Date().toISOString(),
      parts: lines,
      subtotal,
      tax,
      total
    });
    setJob(""); setCustId(""); setLines([]);
  };

  return (
    <div>
      <h2>Service & Invoice</h2>
      <input placeholder="Job Name" value={job} onChange={e => setJob(e.target.value)} />

      <select value={custId} onChange={e => setCustId(e.target.value)}>
        <option value="">Select Customer</option>
        {customers.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <h4>+ New Customer</h4>
      <input placeholder="Name"  value={newCust.name}  onChange={e => setNewCust(n => ({ ...n, name: e.target.value }))}/>
      <input placeholder="Phone" value={newCust.phone} onChange={e => setNewCust(n => ({ ...n, phone: e.target.value }))}/>
      <button
        onClick={() => {
          const id = `cust_${Date.now()}`;
          addCustomer({ ...newCust, id });
          setCustId(id);
          setNewCust({ name: "", phone: "" });
        }}
        disabled={!newCust.name}
      >
        Add Customer
      </button>

      <hr />

      <h4>Add Part</h4>
      <select value={partId} onChange={e => setPartId(e.target.value)}>
        <option value="">Select Part</option>
        {inventory.map(p => (
          <option key={p.id} value={p.id}>
            {p.name} (stock: {p.qty})
          </option>
        ))}
      </select>
      <input type="number" min="1" value={qty}    onChange={e => setQty(+e.target.value)} />
      <input type="number"      value={price} onChange={e => setPrice(+e.target.value)} placeholder="Unit Price" />
      <button onClick={addLine} disabled={!partId || !price}>
        Add Line
      </button>

      <ul>
        {lines.map((l,i) => (
          <li key={i}>
            {l.name} × {l.qty} @ ${l.price.toFixed(2)}
          </li>
        ))}
      </ul>

      <button onClick={finishInvoice} disabled={!(job && custId && lines.length)}>
        Complete & Log Invoice
      </button>
    </div>
  );
}
