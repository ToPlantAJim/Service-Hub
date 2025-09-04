import { createContext, useState } from "react";

export const InventoryContext = createContext();

export function InventoryProvider({ children }) {
  const [inventory, setInventory] = useState([]);

  const addItem = item =>
    setInventory(inv => [...inv, { ...item, id: `part_${Date.now()}` }]);

  const useItem = (id, qty) =>
    setInventory(inv =>
      inv.map(p => (p.id === id ? { ...p, qty: p.qty - qty } : p))
    );

  return (
    <InventoryContext.Provider value={{ inventory, addItem, useItem }}>
      {children}
    </InventoryContext.Provider>
  );
}
