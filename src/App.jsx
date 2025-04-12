import { useState } from "react";
import InventoryTab from "./components/InventoryTab";
import ServiceTrailTab from "./components/ServiceTrailTab";
import InvoicesTab from "./components/InvoicesTab";
import CustomersTab from "./components/CustomersTab";
import ContractsTab from "./components/ContractsTab";

export default function App() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [inventory, setInventory] = useState([]);

  const handleUsePart = (usedItem) => {
    setInventory(prev =>
      prev.map(item =>
        item.name === usedItem.name
          ? { ...item, quantity: item.quantity - usedItem.quantity }
          : item
      )
    );
  };

  return (
    <div style={{ backgroundColor: "#111", color: "white", minHeight: "100vh", padding: "20px" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>ServiceHub</h1>

      <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("inventory")} style={activeTab === "inventory" ? activeStyle : tabStyle}>
          Inventory
        </button>
        <button onClick={() => setActiveTab("service")} style={activeTab === "service" ? activeStyle : tabStyle}>
          Service Trail™
        </button>
        <button onClick={() => setActiveTab("invoices")} style={activeTab === "invoices" ? activeStyle : tabStyle}>
          Invoices
        </button>
        <button onClick={() => setActiveTab("customers")} style={activeTab === "customers" ? activeStyle : tabStyle}>
          Customers
        </button>
        <button onClick={() => setActiveTab("contracts")} style={activeTab === "contracts" ? activeStyle : tabStyle}>
          Contracts
        </button>
      </div>

      {activeTab === "inventory" && (
        <InventoryTab inventory={inventory} setInventory={setInventory} />
      )}
      {activeTab === "service" && (
        <ServiceTrailTab inventory={inventory} onUsePart={handleUsePart} />
      )}
      {activeTab === "invoices" && (
        <InvoicesTab />
      )}
      {activeTab === "customers" && (
        <CustomersTab />
      )}
      {activeTab === "contracts" && (
        <ContractsTab />
      )}
    </div>
  );
}

const tabStyle = {
  backgroundColor: "#333",
  color: "white",
  padding: "10px 20px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer"
};

const activeStyle = {
  ...tabStyle,
  backgroundColor: "#4CAF50"
};
