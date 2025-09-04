import React, { useMemo, useState } from "react";

const uid = () => Math.random().toString(36).slice(2, 9);

export default function CustomersTab({ customers, setCustomers }) {
  // Add form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");

  // Search
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.phone, c.address, c.email]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [customers, query]);

  function addCustomer() {
    if (!name.trim()) return alert("Name is required.");
    setCustomers((prev) => [
      { id: uid(), name: name.trim(), phone: phone.trim(), address: address.trim(), email: email.trim() },
      ...prev,
    ]);
    setName(""); setPhone(""); setAddress(""); setEmail("");
  }

  function removeCustomer(id) {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }

  // Import / Export
  function exportCustomers() {
    const blob = new Blob([JSON.stringify(customers, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "servicehub_customers.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function importCustomers(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error("Expected an array of customers.");
        const cleaned = data
          .filter((c) => c && (c.name || c["Customer full name"]))
          .map((c) => ({
            id: c.id || uid(),
            name: c.name || c["Customer full name"] || "Unnamed",
            phone: c.phone || c["Phone numbers"] || "",
            address: c.address || c["Bill address"] || "",
            email: c.email || c["Email"] || "",
          }));
        setCustomers(cleaned);
        alert(`Imported ${cleaned.length} customers.`);
      } catch (e) {
        alert("Import failed: " + e.message);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="mt-6 card p-4">
      <h2 className="text-xl font-semibold mb-4">Customers</h2>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button className="btn btn-ghost" onClick={exportCustomers}>Export JSON</button>
        <label className="btn btn-ghost cursor-pointer">
          Import JSON
          <input
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => e.target.files?.[0] && importCustomers(e.target.files[0])}
          />
        </label>
        <input
          className="input ml-auto"
          placeholder="Search name / phone / email / address…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Add new customer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
        <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="input" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <button className="btn btn-primary" onClick={addCustomer}>Add Customer</button>

      {/* List */}
      <div className="mt-6 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="py-2">Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Email</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="py-2">{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.address}</td>
                <td>{c.email}</td>
                <td>
                  <button className="btn btn-ghost" onClick={() => removeCustomer(c.id)}>Remove</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="py-4 opacity-70" colSpan={5}>No customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
