import { useContext } from "react";
import { InvoiceContext } from "../contexts/InvoiceContext";

export default function InvoicesTab() {
  const { invoices, togglePaid } = useContext(InvoiceContext);

  return (
    <div>
      <h2>Invoice History</h2>
      {invoices.map(inv => (
        <div key={inv.id} style={{ margin: 12, padding: 12, background: "#222" }}>
          <h3>
            {inv.job} — {inv.customerName} (
            {new Date(inv.date).toLocaleDateString()})
          </h3>
          <ul>
            {inv.parts.map((p,i) => (
              <li key={i}>
                {p.name} × {p.qty} @ ${p.price.toFixed(2)}
              </li>
            ))}
          </ul>
          <p>Subtotal: ${inv.subtotal.toFixed(2)}</p>
          <p>Tax: ${inv.tax.toFixed(2)}</p>
          <p>
            <strong>Total: ${inv.total.toFixed(2)}</strong>
          </p>
          <label>
            <input
              type="checkbox"
              checked={inv.paid}
              onChange={() => togglePaid(inv.id)}
            />{" "}
            Paid
          </label>
        </div>
      ))}
    </div>
  );
}
