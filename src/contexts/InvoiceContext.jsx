import { createContext, useState } from "react";

export const InvoiceContext = createContext();

export function InvoiceProvider({ children }) {
  const [invoices, setInvoices] = useState([]);

  const logInvoice = inv =>
    setInvoices(list => [...list, { ...inv, paid: false }]);

  const togglePaid = id =>
    setInvoices(list =>
      list.map(i => (i.id === id ? { ...i, paid: !i.paid } : i))
    );

  return (
    <InvoiceContext.Provider value={{ invoices, logInvoice, togglePaid }}>
      {children}
    </InvoiceContext.Provider>
  );
}
