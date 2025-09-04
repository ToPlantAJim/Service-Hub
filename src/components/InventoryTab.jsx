import React, { useMemo, useState } from "react";
import QRCode from "qrcode";

const uid = () => Math.random().toString(36).slice(2, 9);
const currency = (n) => (isFinite(n) ? n : 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
const num = (v, d = 2) => (Number.isFinite(+v) ? +(+v).toFixed(d) : 0);

export default function InventoryTab({ inventory, setInventory }) {
  // Add form
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [cost, setCost] = useState(0);
  const [markup, setMarkup] = useState(100);
  const [qty, setQty] = useState(0);

  const price = useMemo(() => num(cost * (1 + markup / 100), 2), [cost, markup]);

  function addItem() {
    if (!name.trim()) return alert("Item name required.");
    setInventory((prev) => [
      { id: uid(), name: name.trim(), sku: sku.trim(), cost: num(cost), markup: num(markup), price, qty: Math.max(0, +qty|0) },
      ...prev,
    ]);
    setName(""); setSku(""); setCost(0); setMarkup(100); setQty(0);
  }

  function removeItem(id) {
    setInventory((prev) => prev.filter((i) => i.id !== id));
  }

  function bumpQty(id, delta) {
    setInventory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, (i.qty || 0) + delta) } : i))
    );
  }

  // Search
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter((i) =>
      [i.name, i.sku].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    );
  }, [inventory, query]);

  // Import / Export (JSON) — includes qty
  function exportInventory() {
    const blob = new Blob([JSON.stringify(inventory, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "servicehub_inventory.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function importInventory(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error("Expected an array of inventory items.");
        const cleaned = data
          .filter((i) => i && (i.name || i.sku))
          .map((i) => ({
            id: i.id || uid(),
            name: i.name || "Unnamed",
            sku: i.sku || "",
            cost: num(i.cost || 0),
            markup: num(i.markup ?? 100),
            price: num(i.price ?? (i.cost ? i.cost * (1 + (i.markup ?? 100) / 100) : 0)),
            qty: Math.max(0, +i.qty || 0),
          }));
        setInventory(cleaned);
        alert(`Imported ${cleaned.length} items.`);
      } catch (e) {
        alert("Import failed: " + e.message);
      }
    };
    reader.readAsText(file);
  }

  // Print QR sheet (1 code per SKU; scanning subtracts 1)
  async function printQRSheet(items = inventory) {
    const w = window.open("", "_blank");
    if (!w) return;

    const cells = [];
    for (const i of items) {
      const payload = JSON.stringify({ t: "inv", id: i.id, sku: i.sku, name: i.name, price: i.price });
      const dataUrl = await QRCode.toDataURL(payload, { margin: 1, scale: 6 });
      cells.push(`
        <div class="cell">
          <img src="${dataUrl}" />
          <div class="label">
            <div class="name">${escapeHtml(i.name)}</div>
            <div class="sku">${escapeHtml(i.sku || "")}</div>
            <div class="price">${currency(i.price)}</div>
          </div>
        </div>
      `);
    }

    w.document.write(`<!doctype html>
      <html><head><meta charset="utf-8"><title>QR Sheet</title>
      <style>
        body{font-family:system-ui,Segoe UI,Roboto; padding:24px;}
        .grid{display:grid; grid-template-columns: repeat(3, 1fr); gap:16px;}
        .cell{border:1px solid #ddd; border-radius:12px; padding:12px; display:flex; gap:12px; align-items:center;}
        .cell img{width:120px; height:120px}
        .label .name{font-weight:600}
        .label .sku{color:#555; font-size:12px}
        .label .price{margin-top:6px}
        @media print {.cell{page-break-inside:avoid}}
      </style>
      </head>
      <body>
        <h2>ServiceHub — Inventory QR Codes</h2>
        <div class="grid">${cells.join("")}</div>
        <script>window.print()</script>
      </body></html>`);
    w.document.close();
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
  }

  return (
    <div className="mt-6 card p-4">
      <h2 className="text-xl font-semibold mb-4">Inventory</h2>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button className="btn btn-ghost" onClick={exportInventory}>Export JSON</button>
        <label className="btn btn-ghost cursor-pointer">
          Import JSON
          <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importInventory(e.target.files[0])} />
        </label>
        <button className="btn btn-primary" onClick={() => printQRSheet()}>Print QR Sheet</button>
        <input className="input ml-auto" placeholder="Search name / SKU…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {/* Add new item */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
        <input className="input" placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
        <input className="input" type="number" placeholder="Cost" value={cost} onChange={(e) => setCost(+e.target.value)} />
        <input className="input" type="number" placeholder="Markup %" value={markup} onChange={(e) => setMarkup(+e.target.value)} />
        <div className="input flex items-center justify-between"><span className="opacity-80">Price</span><span className="font-medium">{currency(price)}</span></div>
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id}>
                <td className="py-2">{i.name}</td>
                <td>{i.sku}</td>
                <td>{currency(i.cost)}</td>
                <td>{i.markup}%</td>
                <td>{currency(i.price)}</td>
                <td>
                  <div className="inline-flex items-center gap-2">
                    <button className="btn btn-ghost" onClick={() => bumpQty(i.id, -1)}>-</button>
                    <input className="input w-20" type="number" value={i.qty || 0}
                           onChange={(e) => setInventory((prev)=>prev.map(x=>x.id===i.id?{...x, qty:Math.max(0, +e.target.value||0)}:x))} />
                    <button className="btn btn-ghost" onClick={() => bumpQty(i.id, +1)}>+</button>
                  </div>
                </td>
                <td>
                  <button className="btn btn-ghost" onClick={() => removeItem(i.id)}>Remove</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td className="py-4 opacity-70" colSpan={7}>No inventory items found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
