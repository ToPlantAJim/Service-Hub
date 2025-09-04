// src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import QRCode from "qrcode";

/* ---------- helpers ---------- */
const uid = () => Math.random().toString(36).slice(2, 9);
const currency = (n) =>
  (isFinite(n) ? n : 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
const num = (v, d = 2) => (Number.isFinite(+v) ? +(+v).toFixed(d) : 0);

/* ---------- localStorage keys ---------- */
const LS = {
  customers: "sh_customers",
  inventory: "sh_inventory",
  invoices: "sh_invoices",
  settings: "sh_settings",
};

/* ---------- defaults ---------- */
const DEFAULT_SETTINGS = {
  laborRate: 125,
  taxRate: 7,                 // %
  mileageThreshold: 30,       // miles (one way)
  serviceChargeWithin: 49,    // $ within threshold
  serviceChargeBeyond: 89,    // $ beyond threshold
  invoicePrefix: "INV-",
};

const DEFAULT_INVENTORY = [
  { id: uid(), name: "1/3 HP Condenser Fan Motor", sku: "CFM-13HP", cost: 98, markup: 65, price: 161.7, qty: 0 },
  { id: uid(), name: "Capacitor 45/5 μF",         sku: "CAP-45/5", cost: 12.5, markup: 200, price: 37.5,  qty: 0 },
  { id: uid(), name: "1/4\" Copper Flare x10 ft",  sku: "COP-14-10", cost: 22,  markup: 80,  price: 39.6,  qty: 0 },
];

const DEFAULT_CUSTOMERS = [{ id: uid(), name: "Walk-In", phone: "", address: "", email: "" }];

/* ---------- storage hook ---------- */
function useStorage(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

/* ========================================================= */
export default function App() {
  const [tab, setTab] = useState("invoice");

  const [customers, setCustomers] = useStorage(LS.customers, DEFAULT_CUSTOMERS);
  const [inventory, setInventory] = useStorage(LS.inventory, DEFAULT_INVENTORY);
  const [invoices, setInvoices]   = useStorage(LS.invoices, []);
  const [settings, setSettings]   = useStorage(LS.settings, DEFAULT_SETTINGS);

  /* --- working invoice state --- */
  const [jobName, setJobName]         = useState("");
  const [customerId, setCustomerId]   = useState(customers[0]?.id || "");
  const [laborHours, setLaborHours]   = useState(0);
  const [laborRate, setLaborRate]     = useState(settings.laborRate);
  const [milesOneWay, setMilesOneWay] = useState(0);
  const [discount, setDiscount]       = useState(0);
  const [lines, setLines]             = useState([]);

  useEffect(() => setLaborRate(settings.laborRate), [settings.laborRate]);
  useEffect(() => {
    if (!customers.find((c) => c.id === customerId) && customers.length > 0) {
      setCustomerId(customers[0].id);
    }
  }, [customers]); // eslint-disable-line

  /* --- derived totals --- */
  const serviceCharge = useMemo(() => {
    const w = settings.serviceChargeWithin;
    const b = settings.serviceChargeBeyond;
    return milesOneWay <= settings.mileageThreshold ? w : b;
  }, [milesOneWay, settings]);

  const laborTotal    = useMemo(() => num(laborHours * laborRate, 2), [laborHours, laborRate]);
  const partsSubtotal = useMemo(() => num(lines.reduce((s, l) => s + l.price * l.qty, 0), 2), [lines]);
  const taxableAmt    = useMemo(
    () => num(lines.filter((l) => l.taxable).reduce((s, l) => s + l.price * l.qty, 0), 2),
    [lines]
  );
  const tax      = useMemo(() => num((taxableAmt * settings.taxRate) / 100, 2), [taxableAmt, settings.taxRate]);
  const subtotal = num(partsSubtotal + laborTotal + serviceCharge, 2);
  const total    = num(Math.max(subtotal + tax - discount, 0), 2);

  /* --- actions --- */
  function addLineFromInventory(invId, qty = 1) {
    const item = inventory.find((i) => i.id === invId);
    if (!item) return;
    // accumulate into existing line if same item
    const existing = lines.find((l) => l.invId === invId && l.price === num(item.price));
    if (existing) {
      setLines((prev) =>
        prev.map((l) => (l.invId === invId ? { ...l, qty: (l.qty || 0) + (+qty || 1) } : l))
      );
    } else {
      setLines((prev) => [
        ...prev,
        { id: uid(), invId, name: item.name, sku: item.sku, qty: +qty || 1, price: num(item.price), taxable: true },
      ]);
    }
  }
  function removeLine(lineId) {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  }
  function resetInvoice() {
    setJobName("");
    setCustomerId(customers[0]?.id || "");
    setLaborHours(0);
    setMilesOneWay(0);
    setDiscount(0);
    setLines([]);
  }
  function completeAndLog() {
    if (!jobName.trim()) return alert("Please enter a Job Name.");
    if (!customerId) return alert("Please select a customer.");
    const customer = customers.find((c) => c.id === customerId);
    const id = settings.invoicePrefix + String(invoices.length + 1).padStart(4, "0");
    const invoice = {
      id,
      createdAt: new Date().toISOString(),
      jobName,
      customer,
      lines,
      laborHours: num(laborHours),
      laborRate:  num(laborRate),
      milesOneWay: num(milesOneWay, 1),
      serviceCharge: num(serviceCharge),
      partsSubtotal,
      taxRate: settings.taxRate,
      tax,
      discount: num(discount),
      total,
    };
    setInvoices((prev) => [invoice, ...prev]);
    resetInvoice();
    setTab("history");
  }

  /* --- QR scanning state/handler --- */
  const [scanOpen, setScanOpen] = useState(false);
  function handleScanPayload(text) {
    try {
      const data = JSON.parse(text);
      if (data?.t !== "inv" || !data?.id) return;

      const item = inventory.find((i) => i.id === data.id);
      if (!item) return alert("Scanned item not found in inventory.");

      // 1) decrement qty
      setInventory((prev) =>
        prev.map((i) => (i.id === data.id ? { ...i, qty: Math.max(0, (i.qty || 0) - 1) } : i))
      );

      // 2) add to current invoice (accumulate qty)
      addLineFromInventory(item.id, 1);
    } catch {
      // ignore bad payload
    }
  }

  return (
    <div className="min-h-screen">
      {/* ---------- sticky header & tabs ---------- */}
      <header className="sticky top-0 z-50 backdrop-blur bg-black/40 ring-1 ring-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">ServiceHub</h1>
          <div className="text-xs md:text-sm text-white/60 select-none">Bowen Mechanical</div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <nav className="tabs">
            <button onClick={() => setTab("invoice")}   className={`tab ${tab === "invoice" ? "tab-active" : ""}`}>Service &amp; Invoice</button>
            <button onClick={() => setTab("history")}   className={`tab ${tab === "history" ? "tab-active" : ""}`}>Invoice History</button>
            <button onClick={() => setTab("customers")} className={`tab ${tab === "customers" ? "tab-active" : ""}`}>Customers</button>
            <button onClick={() => setTab("inventory")} className={`tab ${tab === "inventory" ? "tab-active" : ""}`}>Inventory</button>
            <button onClick={() => setTab("settings")}  className={`tab ${tab === "settings" ? "tab-active" : ""}`}>Settings</button>
          </nav>
        </div>
      </header>

      {/* ---------- main content ---------- */}
      <main className="max-w-6xl mx-auto px-4 py-6">

        {/* Service & Invoice */}
        {tab === "invoice" && (
          <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Service &amp; Invoice</h2>
                <div className="flex items-center gap-2">
                  <button className="btn btn-primary" onClick={() => setScanOpen(true)}>Scan Item (QR)</button>
                </div>
              </div>

              {/* job + customer + hours */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <input className="input" placeholder="Job Name" value={jobName} onChange={(e) => setJobName(e.target.value)} />
                <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name || "Unnamed"}</option>
                  ))}
                </select>
                <input
                  type="number" min={0} step={0.25}
                  className="input"
                  placeholder="Labor Hours"
                  value={laborHours}
                  onChange={(e) => setLaborHours(+e.target.value)}
                />
              </div>

              {/* travel + rate + discount */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="opacity-80">Miles (one way)</span>
                  <input type="number" min={0} step={1} className="input w-28" value={milesOneWay} onChange={(e) => setMilesOneWay(+e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="opacity-80">Labor Rate</span>
                  <input type="number" min={0} step={1} className="input w-28" value={laborRate} onChange={(e) => setLaborRate(+e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="opacity-80">Discount ($)</span>
                  <input type="number" min={0} step={1} className="input w-28" value={discount} onChange={(e) => setDiscount(+e.target.value)} />
                </div>
              </div>

              {/* add part from inventory */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="font-semibold mb-2">Add Part</h3>
                <AddLineForm inventory={inventory} onAdd={addLineFromInventory} />
              </div>

              {/* line items */}
              <div className="mt-4 overflow-x-auto">
                {lines.length === 0 ? (
                  <div className="text-sm opacity-70">No parts added yet.</div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="py-2">Item</th>
                        <th>SKU</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Line Total</th>
                        <th>Tax</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((l) => (
                        <tr key={l.id}>
                          <td className="py-2">{l.name}</td>
                          <td>{l.sku}</td>
                          <td>
                            <input
                              type="number" min={1} step={1}
                              className="input w-20"
                              value={l.qty}
                              onChange={(e) =>
                                setLines((prev) => prev.map((x) => (x.id === l.id ? { ...x, qty: +e.target.value } : x)))
                              }
                            />
                          </td>
                          <td>{currency(l.price)}</td>
                          <td>{currency(num(l.price * l.qty))}</td>
                          <td>
                            <input
                              type="checkbox"
                              checked={l.taxable}
                              onChange={(e) =>
                                setLines((prev) => prev.map((x) => (x.id === l.id ? { ...x, taxable: e.target.checked } : x)))
                              }
                            />
                          </td>
                          <td>
                            <button className="btn btn-ghost" onClick={() => removeLine(l.id)}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* summary (sticky) */}
            <div className="card p-4 lg:sticky lg:top-24 h-fit">
              <h3 className="font-semibold mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <Row label="Service Charge">{currency(serviceCharge)}</Row>
                <Row label={`Labor (${laborHours || 0}h × ${currency(laborRate)})`}>{currency(laborTotal)}</Row>
                <Row label="Parts Subtotal">{currency(partsSubtotal)}</Row>
                <Row label={`Tax (${settings.taxRate}%)`}>{currency(tax)}</Row>
                <Row label="Discount">-{currency(discount)}</Row>
                <div className="border-t border-white/10 my-2" />
                <Row bold label="Total">{currency(total)}</Row>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn btn-primary" onClick={completeAndLog}>Complete &amp; Log Invoice</button>
                <button className="btn btn-ghost" onClick={resetInvoice}>Reset</button>
              </div>
            </div>
          </div>
        )}

        {/* history */}
        {tab === "history" && (
          <div className="mt-2 card p-4">
            <h2 className="text-xl font-semibold mb-4">Invoice History</h2>
            {invoices.length === 0 ? (
              <div className="opacity-70 text-sm">No invoices yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="py-2">Invoice #</th>
                      <th>Date</th>
                      <th>Job</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-2">{inv.id}</td>
                        <td>{new Date(inv.createdAt).toLocaleString()}</td>
                        <td>{inv.jobName}</td>
                        <td>{inv.customer?.name}</td>
                        <td>{currency(inv.total)}</td>
                        <td>
                          <button className="btn btn-ghost" onClick={() => openInvoiceJSON(inv)}>JSON</button>
                          <button className="btn btn-ghost" onClick={() => printInvoice(inv)}>Print</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* customers */}
        {tab === "customers" && <CustomersTab customers={customers} setCustomers={setCustomers} />}

        {/* inventory (per-item QR download) */}
        {tab === "inventory" && <InventoryTab inventory={inventory} setInventory={setInventory} />}

        {/* settings */}
        {tab === "settings" && <SettingsTab settings={settings} setSettings={setSettings} />}
      </main>

      {/* QR Scanner Modal */}
      <ScanModal open={scanOpen} onClose={() => setScanOpen(false)} onDetected={handleScanPayload} />
    </div>
  );
}

/* ---------- small UI helpers ---------- */
function Row({ label, children, bold }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-lg" : ""}`}>
      <span className="opacity-80">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function AddLineForm({ inventory, onAdd }) {
  const [invId, setInvId] = useState(inventory[0]?.id || "");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!inventory.find((i) => i.id === invId) && inventory.length > 0) {
      setInvId(inventory[0].id);
    }
  }, [inventory]); // eslint-disable-line

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className="input" value={invId} onChange={(e) => setInvId(e.target.value)}>
        {inventory.map((i) => (
          <option key={i.id} value={i.id}>{i.name} — {currency(i.price)}</option>
        ))}
      </select>
      <input type="number" min={1} step={1} className="input w-24" value={qty} onChange={(e) => setQty(+e.target.value)} />
      <button className="btn btn-ghost" onClick={() => onAdd(invId, qty)}>Add Line</button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm opacity-80">{label}</div>
      {children}
    </label>
  );
}

/* ---------- Customers Tab (simple, no import/export) ---------- */
/* ---------- Customers Tab (inline edit) ---------- */
function CustomersTab({ customers, setCustomers }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");

  // search
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

  // row editing state
  const [editingId, setEditingId] = useState(null);
  const [eName, setEName] = useState("");
  const [ePhone, setEPhone] = useState("");
  const [eAddress, setEAddress] = useState("");
  const [eEmail, setEEmail] = useState("");

  function startEdit(c) {
    setEditingId(c.id);
    setEName(c.name || "");
    setEPhone(c.phone || "");
    setEAddress(c.address || "");
    setEEmail(c.email || "");
  }
  function cancelEdit() {
    setEditingId(null);
    setEName(""); setEPhone(""); setEAddress(""); setEEmail("");
  }
  function saveEdit() {
    if (!eName.trim()) return alert("Name is required.");
    setCustomers(prev =>
      prev.map(c =>
        c.id === editingId
          ? { ...c, name: eName.trim(), phone: ePhone.trim(), address: eAddress.trim(), email: eEmail.trim() }
          : c
      )
    );
    cancelEdit();
  }

  function addCustomer() {
    if (!name.trim()) return alert("Name is required.");
    setCustomers(prev => [
      { id: uid(), name: name.trim(), phone: phone.trim(), address: address.trim(), email: email.trim() },
      ...prev,
    ]);
    setName(""); setPhone(""); setAddress(""); setEmail("");
  }
  function removeCustomer(id) {
    if (editingId === id) cancelEdit();
    setCustomers(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="mt-2 card p-4">
      <h2 className="text-xl font-semibold mb-4">Customers</h2>

      <div className="flex flex-wrap items-center gap-2 mb-4">
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
              <th className="w-48"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const isEditing = editingId === c.id;
              return (
                <tr key={c.id}>
                  <td className="py-2">
                    {isEditing ? (
                      <input className="input w-full" value={eName} onChange={(e) => setEName(e.target.value)} />
                    ) : (
                      c.name
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input className="input w-full" value={ePhone} onChange={(e) => setEPhone(e.target.value)} />
                    ) : (
                      c.phone
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input className="input w-full" value={eAddress} onChange={(e) => setEAddress(e.target.value)} />
                    ) : (
                      c.address
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input className="input w-full" value={eEmail} onChange={(e) => setEEmail(e.target.value)} />
                    ) : (
                      c.email
                    )}
                  </td>
                  <td className="flex gap-2 py-2">
                    {isEditing ? (
                      <>
                        <button className="btn btn-primary" onClick={saveEdit}>Save</button>
                        <button className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-ghost" onClick={() => startEdit(c)}>Edit</button>
                        <button className="btn btn-ghost" onClick={() => removeCustomer(c.id)}>Remove</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
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

/* ---------- Inventory Tab (per-item QR download) ---------- */
/* ---------- Inventory Tab (inline edit + per-item QR) ---------- */
function InventoryTab({ inventory, setInventory }) {
  const [name, setName]   = useState("");
  const [sku, setSku]     = useState("");
  const [cost, setCost]   = useState(0);
  const [markup, setMarkup] = useState(100);
  const [qty, setQty]     = useState(0);

  const price = useMemo(() => num(cost * (1 + markup / 100), 2), [cost, markup]);

  function addItem() {
    if (!name.trim()) return alert("Item name required.");
    setInventory((prev) => [
      {
        id: uid(),
        name: name.trim(),
        sku: sku.trim(),
        cost: num(cost),
        markup: num(markup),
        price,
        qty: Math.max(0, +qty | 0),
      },
      ...prev,
    ]);
    setName(""); setSku(""); setCost(0); setMarkup(100); setQty(0);
  }
  function removeItem(id) {
    // cancel edit if deleting that row
    if (editingId === id) cancelEdit();
    setInventory((prev) => prev.filter((i) => i.id !== id));
  }
  function bumpQty(id, delta) {
    setInventory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, (i.qty || 0) + delta) } : i))
    );
  }

  // search
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter((i) =>
      [i.name, i.sku].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    );
  }, [inventory, query]);

  // per-item QR download
  async function downloadQR(item) {
    const payload = JSON.stringify({ t: "inv", id: item.id, sku: item.sku, name: item.name, price: item.price });
    const dataUrl = await QRCode.toDataURL(payload, { margin: 1, scale: 8 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${(item.sku || item.name || "item").replace(/\s+/g, "_")}-QR.png`;
    a.click();
  }

  // inline editing state
  const [editingId, setEditingId] = useState(null);
  const [eName, setEName]       = useState("");
  const [eSku, setESku]         = useState("");
  const [eCost, setECost]       = useState(0);
  const [eMarkup, setEMarkup]   = useState(100);
  const [ePrice, setEPrice]     = useState(0);
  const [eQty, setEQty]         = useState(0);

  function startEdit(item) {
    setEditingId(item.id);
    setEName(item.name || "");
    setESku(item.sku || "");
    setECost(item.cost ?? 0);
    setEMarkup(item.markup ?? 100);
    setEPrice(item.price ?? 0);
    setEQty(item.qty ?? 0);
  }
  function cancelEdit() {
    setEditingId(null);
    setEName(""); setESku(""); setECost(0); setEMarkup(100); setEPrice(0); setEQty(0);
  }
  function saveEdit() {
    if (!eName.trim()) return alert("Item name required.");
    setInventory((prev) =>
      prev.map((i) =>
        i.id === editingId
          ? {
              ...i,
              name: eName.trim(),
              sku: eSku.trim(),
              cost: num(eCost),
              markup: num(eMarkup),
              price: num(ePrice),
              qty: Math.max(0, +eQty | 0),
            }
          : i
      )
    );
    cancelEdit();
  }
  function recalcPrice() {
    setEPrice(num((+eCost || 0) * (1 + (+eMarkup || 0) / 100), 2));
  }

  return (
    <div className="mt-2 card p-4">
      <h2 className="text-xl font-semibold mb-4">Inventory</h2>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          className="input ml-auto"
          placeholder="Search name / SKU…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Add new item */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
        <input className="input" placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
        <input className="input" type="number" placeholder="Cost" value={cost} onChange={(e) => setCost(+e.target.value)} />
        <input className="input" type="number" placeholder="Markup %" value={markup} onChange={(e) => setMarkup(+e.target.value)} />
        <div className="input flex items-center justify-between">
          <span className="opacity-80">Price</span>
          <span className="font-medium">{currency(price)}</span>
        </div>
        <input className="input" type="number" placeholder="Qty" value={qty} onChange={(e) => setQty(e.target.value)} />
      </div>
      <button className="btn btn-primary" onClick={addItem}>Add Item</button>

      {/* List */}
      <div className="mt-6 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="py-2">Item</th>
              <th>SKU</th>
              <th>Cost</th>
              <th>Markup %</th>
              <th>Price</th>
              <th>Qty</th>
              <th>QR</th>
              <th className="w-56"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => {
              const isEditing = editingId === i.id;
              return (
                <tr key={i.id}>
                  <td className="py-2">
                    {isEditing ? (
                      <input className="input w-full" value={eName} onChange={(e) => setEName(e.target.value)} />
                    ) : (
                      i.name
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input className="input w-full" value={eSku} onChange={(e) => setESku(e.target.value)} />
                    ) : (
                      i.sku
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input className="input w-28" type="number" value={eCost} onChange={(e) => setECost(+e.target.value)} />
                    ) : (
                      currency(i.cost)
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input className="input w-24" type="number" value={eMarkup} onChange={(e) => setEMarkup(+e.target.value)} />
                    ) : (
                      `${i.markup}%`
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input className="input w-28" type="number" value={ePrice} onChange={(e) => setEPrice(+e.target.value)} />
                        <button className="btn btn-ghost" onClick={recalcPrice} title="Recalc from cost & markup">
                          Recalc
                        </button>
                      </div>
                    ) : (
                      currency(i.price)
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input className="input w-20" type="number" value={eQty} onChange={(e) => setEQty(+e.target.value)} />
                    ) : (
                      <div className="inline-flex items-center gap-2">
                        <button className="btn btn-ghost" onClick={() => bumpQty(i.id, -1)}>-</button>
                        <input
                          className="input w-20"
                          type="number"
                          value={i.qty || 0}
                          onChange={(e) =>
                            setInventory((prev) =>
                              prev.map((x) =>
                                x.id === i.id ? { ...x, qty: Math.max(0, +e.target.value || 0) } : x
                              )
                            )
                          }
                        />
                        <button className="btn btn-ghost" onClick={() => bumpQty(i.id, +1)}>+</button>
                      </div>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => downloadQR(i)}>QR Code</button>
                  </td>
                  <td className="flex gap-2 py-2">
                    {isEditing ? (
                      <>
                        <button className="btn btn-primary" onClick={saveEdit}>Save</button>
                        <button className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-ghost" onClick={() => startEdit(i)}>Edit</button>
                        <button className="btn btn-ghost" onClick={() => removeItem(i.id)}>Remove</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td className="py-4 opacity-70" colSpan={8}>No inventory items found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


/* ---------- Settings Tab ---------- */
function SettingsTab({ settings, setSettings }) {
  const upd = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  return (
    <div className="mt-2 card p-4">
      <h2 className="text-xl font-semibold mb-4">Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Labor Rate ($/hr)">
          <input type="number" className="input" value={settings.laborRate} onChange={(e) => upd("laborRate", +e.target.value)} />
        </Field>
        <Field label="Tax Rate (%)">
          <input type="number" className="input" value={settings.taxRate} onChange={(e) => upd("taxRate", +e.target.value)} />
        </Field>
        <Field label="Mileage Threshold (mi, one way)">
          <input type="number" className="input" value={settings.mileageThreshold} onChange={(e) => upd("mileageThreshold", +e.target.value)} />
        </Field>
        <Field label="Service Charge ≤ threshold ($)">
          <input type="number" className="input" value={settings.serviceChargeWithin} onChange={(e) => upd("serviceChargeWithin", +e.target.value)} />
        </Field>
        <Field label="Service Charge > threshold ($)">
          <input type="number" className="input" value={settings.serviceChargeBeyond} onChange={(e) => upd("serviceChargeBeyond", +e.target.value)} />
        </Field>
        <Field label="Invoice Prefix">
          <input className="input" value={settings.invoicePrefix} onChange={(e) => upd("invoicePrefix", e.target.value)} />
        </Field>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="btn btn-ghost" onClick={() => setSettings(DEFAULT_SETTINGS)}>Reset Settings</button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
        >
          Wipe All Data (local)
        </button>
      </div>
    </div>
  );
}

/* ---------- Scan Modal (camera) ---------- */
function ScanModal({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    (async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const deviceId = devices?.[0]?.deviceId;
        await codeReader.decodeFromVideoDevice(deviceId, videoRef.current, (result) => {
          if (result) onDetected(result.getText());
        });
      } catch (e) {
        console.error(e);
        alert("Camera/scan error. Check permissions.");
      }
    })();

    return () => {
      try { codeReader.reset(); } catch {}
    };
  }, [open, onDetected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center">
      <div className="card p-4 w-[min(95vw,720px)]">
        <h3 className="text-lg font-semibold mb-3">Scan Item (QR)</h3>
        <video ref={videoRef} className="w-full rounded-xl bg-black" muted playsInline />
        <div className="mt-4 flex justify-end">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- utilities for history actions ---------- */
function openInvoiceJSON(inv) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(inv, null, 2)], { type: "application/json" }));
  window.open(url, "_blank");
}

function printInvoice(inv) {
  const w = window.open("", "_blank");
  if (!w) return;

  const lines = inv.lines
    .map(
      (l) =>
        `<tr><td>${l.name}</td><td>${l.sku || ""}</td><td>${l.qty}</td><td class='right'>$${l.price.toFixed(
          2
        )}</td><td class='right'>$${(l.price * l.qty).toFixed(2)}</td></tr>`
    )
    .join("");

  const html = [
    "<!doctype html><html><head><meta charset='utf-8'/>",
    `<title>${inv.id}</title>`,
    "<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial; padding:24px;} h1{margin:0 0 8px 0} table{width:100%; border-collapse:collapse;} th,td{border-top:1px solid #ddd; padding:8px; text-align:left} .right{text-align:right} .muted{color:#666} .totals{margin-top:16px; width:300px; float:right}</style>",
    "</head><body>",
    `<h1>Invoice ${inv.id}</h1>`,
    `<div class='muted'>${new Date(inv.createdAt).toLocaleString()}</div>`,
    `<h3 style='margin-top:16px'>${inv.jobName}</h3>`,
    `<div><strong>Customer:</strong> ${inv.customer?.name || ""}</div>`,
    `<div class='muted'>${inv.customer?.phone || ""} · ${inv.customer?.address || ""}</div>`,
    "<h3 style='margin-top:24px'>Parts</h3>",
    "<table><thead><tr><th>Item</th><th>SKU</th><th>Qty</th><th class='right'>Price</th><th class='right'>Line</th></tr></thead>",
    `<tbody>${lines}</tbody></table>`,
    "<div class='totals'><table>",
    `<tr><td>Service Charge</td><td class='right'>$${inv.serviceCharge.toFixed(2)}</td></tr>`,
    `<tr><td>Labor (${inv.laborHours}h × $${inv.laborRate.toFixed(2)})</td><td class='right'>$${(
      inv.laborHours * inv.laborRate
    ).toFixed(2)}</td></tr>`,
    `<tr><td>Parts Subtotal</td><td class='right'>$${inv.partsSubtotal.toFixed(2)}</td></tr>`,
    `<tr><td>Tax (${inv.taxRate}%)</td><td class='right'>$${inv.tax.toFixed(2)}</td></tr>`,
    `<tr><td>Discount</td><td class='right'>-$${inv.discount.toFixed(2)}</td></tr>`,
    `<tr><th>Total</th><th class='right'>$${inv.total.toFixed(2)}</th></tr>`,
    "</table></div>",
    "<script>window.print()</" + "script>",
    "</body></html>",
  ].join("");

  w.document.write(html);
  w.document.close();
}
