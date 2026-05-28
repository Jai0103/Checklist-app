import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LogOut,
  Plus,
  Printer,
  Download,
  Upload,
  UploadCloud,
  Trash2,
  Search,
  FileText,
  Eye,
  X,
  Database,
  ClipboardCheck
} from "lucide-react";
import { categories, createDefaultTender } from "../data/templates";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { exportTenderCsv, downloadCsvTemplate } from "../utils/exportCsv";

const statuses = ["Not Started", "In Progress", "Completed", "Pending Review"];

export default function Dashboard({ onLogout }) {
  const [tenders, setTenders] = useLocalStorage("tenderProjects", [createDefaultTender()]);
  const [activeId, setActiveId] = useState(tenders[0]?.id);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortStatus, setSortStatus] = useState("");
  const [viewItem, setViewItem] = useState(null);
  const [mandatoryOnly, setMandatoryOnly] = useState(false);

  const tender = tenders.find((t) => t.id === activeId) || tenders[0];

  function updateTender(patch) {
    setTenders((prev) => prev.map((t) => (t.id === tender.id ? { ...t, ...patch } : t)));
  }

  function updateItem(id, patch) {
    updateTender({
      checklist: tender.checklist.map((item) => (item.id === id ? { ...item, ...patch } : item))
    });
  }

function addTender() {
  const next = createDefaultTender();
  next.companyName = tender?.companyName || "AGA";
  next.name = `Project ${tenders.length + 1}`;
  next.reference = `PA-ITT-2026-${String(tenders.length + 1).padStart(4, "0")}`;
  setTenders([...tenders, next]);
  setActiveId(next.id);
}

  function deleteTender(id) {
    if (tenders.length === 1) return alert("At least one tender project is required.");
    const next = tenders.filter((t) => t.id !== id);
    setTenders(next);
    setActiveId(next[0].id);
  }

  function addItem() {
    updateTender({
      checklist: [
        ...tender.checklist,
        {
          id: crypto.randomUUID(),
          category: categories[0],
          requirement: "New requirement",
          mandatory: true,
          remarks: "",
          status: "Not Started"
        }
      ]
    });
  }

  function deleteItem(id) {
    updateTender({
      checklist: tender.checklist.filter((item) => item.id !== id)
    });
  }

  function bulkUpdate(status) {
    updateTender({
      checklist: tender.checklist.map((item) => ({ ...item, status }))
    });
  }

  function uploadLogo(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => updateTender({ logo: reader.result });
    reader.readAsDataURL(file);
  }

  function exportBackup() {
  const backup = {
    exportedAt: new Date().toISOString(),
    tenders
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "project-management-backup.json";
  link.click();

  URL.revokeObjectURL(url);
}

function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const backup = JSON.parse(reader.result);

      if (!Array.isArray(backup.tenders)) {
        alert("Invalid backup file.");
        return;
      }

      setTenders(backup.tenders);
      setActiveId(backup.tenders[0]?.id);
      e.target.value = "";
    } catch {
      alert("Unable to import backup file.");
    }
  };

  reader.readAsText(file);
}

  function uploadCsv(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const text = String(reader.result || "");
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      alert("CSV file is empty or missing item rows.");
      return;
    }

    const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());

    const categoryIndex = headers.findIndex((h) => h.includes("category"));
    const requirementIndex = headers.findIndex((h) => h.includes("requirement") || h.includes("action"));
    const mandatoryIndex = headers.findIndex((h) => h.includes("mandatory"));
    const remarksIndex = headers.findIndex((h) => h.includes("remark") || h.includes("note"));
    const statusIndex = headers.findIndex((h) => h.includes("status"));

    if (categoryIndex === -1 || requirementIndex === -1) {
      alert("CSV must include at least Category and Requirement columns.");
      return;
    }

    const importedItems = lines.slice(1).map((line) => {
      const cells = parseCsvLine(line);

      const statusValue = cells[statusIndex]?.trim() || "Not Started";
      const cleanStatus = statuses.includes(statusValue) ? statusValue : "Not Started";

      return {
        id: crypto.randomUUID(),
        category: cells[categoryIndex]?.trim() || categories[0],
        requirement: cells[requirementIndex]?.trim() || "Untitled requirement",
        mandatory: ["yes", "true", "mandatory", "1"].includes(
          String(cells[mandatoryIndex] || "").trim().toLowerCase()
        ),
        remarks: cells[remarksIndex]?.trim() || "",
        status: cleanStatus
      };
    });

    updateTender({
      checklist: [...tender.checklist, ...importedItems]
    });

    e.target.value = "";
  };

  reader.readAsText(file);
}

  const filteredItems = useMemo(() => {
    return tender.checklist
      .filter((item) => {
        const matchSearch =
          item.requirement.toLowerCase().includes(search.toLowerCase()) ||
          item.remarks.toLowerCase().includes(search.toLowerCase());

const matchCategory = category ? item.category === category : true;
const matchMandatory = mandatoryOnly ? item.mandatory && item.status !== "Completed" : true;

return matchSearch && matchCategory && matchMandatory;
      })
      .sort((a, b) => {
        if (!sortStatus) return 0;
        return a.status === sortStatus ? -1 : b.status === sortStatus ? 1 : 0;
      });
  }, [tender, search, category, sortStatus, mandatoryOnly]);

const analytics = useMemo(() => {
  const total = tender.checklist.length;
  const completed = tender.checklist.filter((i) => i.status === "Completed").length;
  const pending = total - completed;
  const pendingReview = tender.checklist.filter((i) => i.status === "Pending Review").length;
  const mandatoryOutstanding = tender.checklist.filter(
    (i) => i.mandatory && i.status !== "Completed"
  ).length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  return { total, completed, pending, pendingReview, mandatoryOutstanding, percentage };
}, [tender]);

  const daysLeft = tender.deadline
  ? Math.ceil((new Date(tender.deadline) - new Date()) / 86400000)
  : null;

const projectRisk = useMemo(() => {
  if (daysLeft !== null && daysLeft < 0) {
    return { label: "Overdue", className: "bg-red-100 text-red-700 border-red-200" };
  }

  if (analytics.mandatoryOutstanding === 0 && analytics.pendingReview === 0) {
    return { label: "Ready", className: "bg-green-100 text-green-700 border-green-200" };
  }

  if (daysLeft !== null && daysLeft <= 7 && analytics.mandatoryOutstanding > 0) {
    return { label: "At Risk", className: "bg-red-100 text-red-700 border-red-200" };
  }

  if (analytics.pendingReview > 0) {
    return { label: "Needs Review", className: "bg-amber-100 text-amber-700 border-amber-200" };
  }

  return { label: "In Progress", className: "bg-blue-100 text-blue-700 border-blue-200" };
}, [analytics, daysLeft]);

const categoryStats = useMemo(() => {
  return categories
    .map((cat) => {
      const items = tender.checklist.filter((item) => item.category === cat);
      const completed = items.filter((item) => item.status === "Completed").length;
      const total = items.length;
      const percentage = total ? Math.round((completed / total) * 100) : 0;

      return { category: cat, completed, total, percentage };
    })
    .filter((item) => item.total > 0);
}, [tender]);



  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="no-print fixed left-0 top-0 hidden h-full w-72 border-r border-slate-200 bg-white p-5 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-800 text-white">
            <FileText />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Project Management System</h2>
            <p className="text-xs text-slate-500">Project Compliance Tool</p>
          </div>
        </div>

        <button
          onClick={addTender}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-bold text-white hover:bg-blue-800"
        >
          <Plus size={18} />
          New Project
        </button>

        <div className="space-y-2">
          {tenders.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm ${
                t.id === tender.id
                  ? "bg-blue-50 font-bold text-blue-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.name}
              <span className="block text-xs text-slate-400">{t.reference}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Project Dashboard</h1>
            <p className="text-sm text-slate-500">Auto-saved locally</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("auth");
              onLogout();
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-100"
          >
            <LogOut size={16} />
            Logout
          </button>
        </header>

        <section className="p-5 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="print-area rounded-2xl border border-slate-200 bg-white p-5 shadow-soft md:p-7"
          >
            <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {tender.logo ? (
                    <img src={tender.logo} className="h-full w-full object-contain" />
                  ) : (
                    <Upload className="text-slate-400" />
                  )}
                </div>
                <div>
                  <input
                    className="w-full text-2xl font-bold text-slate-900 outline-none"
                    value={tender.companyName}
                    onChange={(e) => updateTender({ companyName: e.target.value })}
                  />
                  <input
                    className="mt-1 w-full text-sm text-slate-500 outline-none"
                    value={tender.name}
                    onChange={(e) => updateTender({ name: e.target.value })}
                  />
                </div>
              </div>

              <div className="no-print flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-100">
                  Upload Logo
                  <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
                </label>
                <button onClick={() => exportTenderCsv(tender)} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
                  <Download size={16} /> CSV
                </button>
                <button
  onClick={downloadCsvTemplate}
  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-100"
>
  <ClipboardCheck size={16} />
  CSV Template
</button>

<button
  onClick={exportBackup}
  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-100"
>
  <Database size={16} />
  Backup
</button>

<label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-100">
  Import Backup
  <input
    type="file"
    accept="application/json"
    onChange={importBackup}
    className="hidden"
  />
</label>
                <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white">
                  <Printer size={16} /> PDF / Print
                </button>
              </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <Field label="Project Reference">
                <input className="input" value={tender.reference} onChange={(e) => updateTender({ reference: e.target.value })} />
              </Field>
              <Field label="Submission Deadline">
                <input className="input" type="date" value={tender.deadline} onChange={(e) => updateTender({ deadline: e.target.value })} />
              </Field>
              <Field label="Countdown">
                <div className="rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-800">
                  {daysLeft === null ? "No deadline set" : daysLeft >= 0 ? `${daysLeft} days left` : "Deadline passed"}
                </div>
              </Field>
              <Field label="Project Risk">
  <div className={`rounded-xl border px-4 py-3 font-bold ${projectRisk.className}`}>
    {projectRisk.label}
  </div>
</Field>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-5">
              <Stat label="Total Items" value={analytics.total} />
              <Stat label="Completed" value={analytics.completed} />
              <Stat label="Pending" value={analytics.pending} />
              <Stat label="Mandatory Outstanding" value={analytics.mandatoryOutstanding} danger />
              <Stat label="Completion" value={`${analytics.percentage}%`} />
            </div>

            <div className="mb-6 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-blue-700 transition-all" style={{ width: `${analytics.percentage}%` }} />
            </div>
            <div className="mb-6 grid gap-3 md:grid-cols-4">
  {categoryStats.map((item) => (
    <div key={item.category} className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {item.category}
      </p>

      <p className="mt-2 text-lg font-bold text-slate-900">
        {item.completed}/{item.total} completed
      </p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full bg-blue-700"
          style={{ width: `${item.percentage}%` }}
        />
      </div>
    </div>
  ))}
</div>

            <div className="no-print mb-5 grid gap-3 md:grid-cols-5">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input className="input pl-10" placeholder="Search requirements..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select className="input" value={sortStatus} onChange={(e) => setSortStatus(e.target.value)}>
                <option value="">Sort by Status</option>
                {statuses.map((s) => <option key={s}>{s}</option>)}
              </select>
              <button
  onClick={() => setMandatoryOnly(!mandatoryOnly)}
  className={`rounded-xl px-4 py-2 text-sm font-bold ${
    mandatoryOnly
      ? "bg-red-600 text-white"
      : "border border-slate-200 text-slate-700 hover:bg-slate-100"
  }`}
>
  Mandatory Outstanding
</button>
            </div>

           <div className="no-print mb-5 flex flex-wrap gap-2">
  <button
    onClick={addItem}
    className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white"
  >
    Add Item
  </button>

  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-100">
    <UploadCloud size={16} />
    Upload CSV
    <input
      type="file"
      accept=".csv,text/csv"
      onChange={uploadCsv}
      className="hidden"
    />
  </label>

  {statuses.map((s) => (
    <button
      key={s}
      onClick={() => bulkUpdate(s)}
      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-100"
    >
      Mark All {s}
    </button>
  ))}

  <button
    onClick={() => deleteTender(tender.id)}
    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
  >
    Delete Project
  </button>
</div>
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-3">Category</th>
                    <th className="p-3">Requirement / Action Item</th>
                    <th className="p-3">Mandatory</th>
                    <th className="p-3">Remarks</th>
<th className="p-3">Owner</th>
<th className="p-3">Priority</th>
<th className="p-3">Status</th>
<th className="no-print p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200">
                      <td className="p-3">
  <input
    className="cell"
    value={item.remarks}
    onChange={(e) => updateItem(item.id, { remarks: e.target.value })}
  />
</td>

<td className="p-3">
  <input
    className="cell"
    value={item.owner || ""}
    onChange={(e) => updateItem(item.id, { owner: e.target.value })}
    placeholder="Owner"
  />
</td>

<td className="p-3">
  <select
    className="cell"
    value={item.priority || "Medium"}
    onChange={(e) => updateItem(item.id, { priority: e.target.value })}
  >
    <option>High</option>
    <option>Medium</option>
    <option>Low</option>
  </select>
</td>

<td className="p-3">
  <select
    className="cell"
    value={item.status}
    onChange={(e) => updateItem(item.id, { status: e.target.value })}
  >
    {statuses.map((s) => <option key={s}>{s}</option>)}
  </select>
</td>
<td className="no-print p-3">
  <div className="flex items-center gap-2">
    <button
      onClick={() => setViewItem(item)}
      className="rounded-lg p-2 text-blue-700 hover:bg-blue-50"
      title="View item"
    >
      <Eye size={18} />
    </button>

    <button
      onClick={() => deleteItem(item.id)}
      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
      title="Delete item"
    >
      <Trash2 size={18} />
    </button>
  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 md:hidden">
              {filteredItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <select className="input mb-3" value={item.category} onChange={(e) => updateItem(item.id, { category: e.target.value })}>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <input className="input mb-3 font-bold" value={item.requirement} onChange={(e) => updateItem(item.id, { requirement: e.target.value })} />
                  <input className="input mb-3" value={item.remarks} onChange={(e) => updateItem(item.id, { remarks: e.target.value })} />
                  <select className="input" value={item.status} onChange={(e) => updateItem(item.id, { status: e.target.value })}>
                    {statuses.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <div className="mt-3 flex gap-2">
  <button
    onClick={() => setViewItem(item)}
    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white"
  >
    <Eye size={16} />
    View
  </button>

  <button
    onClick={() => deleteItem(item.id)}
    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600"
  >
    <Trash2 size={16} />
    Delete
  </button>
</div>
                </div>
              ))}
            </div>

            <footer className="mt-8 border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
              Tender Submission Management System
            </footer>
          </motion.div>
        </section>
      </main>

      <button onClick={addItem} className="no-print fixed bottom-5 right-5 rounded-full bg-blue-700 p-4 text-white shadow-soft md:hidden">
        <Plus />
      </button>

      {viewItem && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            Checklist Item
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {viewItem.requirement}
          </h2>
        </div>

        <button
          onClick={() => setViewItem(null)}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          title="Close"
        >
          <X size={22} />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Detail label="Category" value={viewItem.category} />
        <Detail label="Status" value={viewItem.status} />
        <Detail label="Mandatory" value={viewItem.mandatory ? "Yes" : "No"} />
        <Detail label="Project Reference" value={tender.reference || "-"} />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Remarks / Notes
        </p>
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
          {viewItem.remarks || "No remarks added."}
        </p>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setViewItem(null)}
          className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
        >
          Close
        </button>
      </div>
    </motion.div>
  </div>
)}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value, danger }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className={`text-2xl font-bold ${danger ? "text-red-600" : "text-slate-900"}`}>{value}</div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
