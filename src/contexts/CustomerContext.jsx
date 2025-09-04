import { createContext, useState } from "react";

export const CustomerContext = createContext();

export function CustomerProvider({ children }) {
  const [customers, setCustomers] = useState([]);

  const addCustomer = c =>
    setCustomers(cs => [...cs, { ...c, id: `cust_${Date.now()}` }]);

  return (
    <CustomerContext.Provider value={{ customers, addCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
}
