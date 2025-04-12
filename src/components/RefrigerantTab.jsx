import { useState, useEffect } from "react";

export default function RefrigerantTab() {
  const [tanks, setTanks] = useState([]);
  const [recoveryLogs, setRecoveryLogs] = useState([]);

  const [form, setForm] = useState({
    id: "",
    type: "R-410A",
    tareWeight: "",
    wc: "",
    currentWeight: "",
    recertDate: "",
  });

  const [recovery, setRecovery] = useState({
    tankId: "",
    job: "",
    amount: "",
    date: "",
    contaminated: false,
    notes: "",
  });

  useEffect(() => {
    const savedTanks = localStorage.getItem("refrigerantTanks");
    const savedLogs = localStorage.getItem("recoveryLogs");
    if (savedTanks) setTanks(JSON.parse(savedTanks));
    if (savedLogs) setRecoveryLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    localStorage.setItem("refrigerantTanks", JSON.stringify(tanks));
  }, [tanks]);

  useEffect(() => {
    localStorage.setItem("recoveryLogs", JSON.stringify(recoveryLogs));
  }, [recoveryLogs]);

  const addTank = () => {
    if (!form.id || !form.tareWeight || !form.wc || !form.currentWeight) return;
    setTanks([{ ...form }, ...tanks]);
    setForm({ id: "", type: "R-410A", tareWeight: "", wc: "", currentWeight: "", recertDate: "" });
  };

  const logRecovery = () => {
    if (!recovery.tankId || !recovery.job || !recovery.amount) return;
    const updatedTanks = tanks.map((t) =>
      t.id === recovery.tankId
        ? { ...t, currentWeight: parseFloat(t.currentWeight) - parseFloat(recovery.amount) }
        : t
    );
    setTanks(updatedTanks);
    setRecoveryLogs([{ ...recovery, date: new Date().toLocaleString() }, ...recoveryLogs]);
    setRecovery({ tankId: "", job: "", amount: "", date: "", contaminated: false, notes: "" });
  };

  return (
    <div>
      <h2>Refrigerant Tanks</h2>

      <h3 style={{ marginTop: "1rem" }}>Add New Tank</h3>
      <input placeholder="Tank ID" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} style={input} />
      <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={input}>
        <option value="R-410A">R-410A</option>
        <option value="R-22">R-22</option>
        <option value="R-134A">R-134A</option>
        <option value="R-404A">R-404A</option>
      </select>
      <input type="number" placeholder="Tare Weight (lbs)" value={form.tareWeight} onChange={(e) => setForm({ ...form, tareWeight: e.target.value })} style={input} />
      <input type="number" placeholder="Water Capacity (WC)" value={form.wc} onChange={(e) => setForm({ ...form, wc: e.target.value })} style={input} />
      <input type="number" placeholder="Current Weight (lbs)" value={form.currentWeight} onChange={(e) => setForm({ ...form, currentWeight: e.target.value })} style={input} />
      <input type="date" placeholder="Recertification Date" value={form.recertDate} onChange={(e) => setForm({ ...form, recertDate: e.target.value })} style={input} />
      <button onClick={addTank} style={addBtn}>Add Tank</button>

      <h3 style={{ marginTop: "2rem" }}>Current Tanks</h3>
      <ul>
        {tanks.map((tank, idx) => (
          <li key={idx}>
            <strong>{tank.id}</strong> - {tank.type} | {tank.currentWeight} lbs remaining | Recert: {tank.recertDate || "N/A"}
          </li>
        ))}
      </ul>

      <h3 style={{ marginTop: "2rem" }}>Recovery Log</h3>
      <select value={recovery.tankId} onChange={(e) => setRecovery({ ...recovery, tankId: e.target.value })} style={input}>
        <option value="">-- Select Tank --</option>
        {tanks.map((tank) => (
          <option key={tank.id} value={tank.id}>{tank.id} ({tank.type})</option>
        ))}
      </select>
      <input placeholder="Job / Source" value={recovery.job} onChange={(e) => setRecovery({ ...recovery, job: e.target.value })} style={input} />
      <input type="number" placeholder="Amount Recovered (lbs)" value={recovery.amount} onChange={(e) => setRecovery({ ...recovery, amount: e.target.value })} style={input} />
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        <input type="checkbox" checked={recovery.contaminated} onChange={(e) => setRecovery({ ...recovery, contaminated: e.target.checked })} />
        {" "}Contaminated / Acidic / Burnout
      </label>
      <textarea placeholder="Notes / Destination / Reason" value={recovery.notes} onChange={(e) => setRecovery({ ...recovery, notes: e.target.value })} style={{ ...input, height: "60px" }} />
      <button onClick={logRecovery} style={logBtn}>Log Recovery</button>

      <ul style={{ marginTop: "1rem" }}>
        {recoveryLogs.map((entry, idx) => (
          <li key={idx}>
            {entry.date}: {entry.amount} lbs recovered from <strong>{entry.job}</strong> using tank {entry.tankId} {entry.contaminated && "(Contaminated)"}<br />
            Notes: {entry.notes}
          </li>
        ))}
      </ul>
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

const addBtn = {
  ...input,
  backgroundColor: "#4CAF50",
  cursor: "pointer"
};

const logBtn = {
  ...input,
  backgroundColor: "#2196F3",
  cursor: "pointer"
};
