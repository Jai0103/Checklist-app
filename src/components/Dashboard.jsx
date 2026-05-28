import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ListChecks,
  FolderKanban,
  Archive,
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
  ClipboardCheck,
  AlertTriangle
} from "lucide-react";
import { categories, createDefaultTender } from "../data/templates";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { exportTenderCsv, downloadCsvTemplate } from "../utils/exportCsv";

const statuses = ["Not Started", "In Progress", "Completed", "Pending Review"];
const priorities = ["High", "Medium", "Low"];

export default function Dashboard({ onLogout }) {
  const [tenders, setTenders] = useLocalStorage("tenderProjects", [createDefaultTender()]);
  const [activeId, setActiveId] = useState(tenders[0]?.id);
  const [activePage, setActivePage] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortStatus, setSortStatus] = useState("");
  const [mandatoryOnly, setMandatoryOnly] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

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
    next.companyName = tender?.companyName || "Apollo Global Academy";
    next.name = `Project ${tenders.length + 1}`;
    next.reference = `PA-ITT-2026-${String(tenders.length + 1).padStart(4, "0")}`;
    setTenders([...tenders, next]);
    setActiveId(next.id);
    setActivePage("projects");
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
          owner: "Project Team",
          priority: "High",
          status: "Not Started"
        }
      ]
    });
  }

  function requestLogout() {
    setConfirmDialog({
      title: "Confirm logout",
      message: "You are about to leave the dashboard. Your latest changes are already saved locally in this browser.",
      confirmLabel: "Logout",
      danger: false,
      onConfirm: () => {
        localStorage.removeItem("auth");
        onLogout();
      }
    });
  }

  function requestDeleteProject(project = tender) {
    if (tenders.length === 1) {
      alert("At least one project is required.");
      return;
    }

    setConfirmDialog({
      title: "Delete this project?",
      message: `This will permanently remove "${project.name}" and all checklist items stored for this project in this browser.`,
      confirmLabel: "Delete Project",
      danger: true,
      onConfirm: () => {
        const next = tenders.filter((t) => t.id !== project.id);
        setTenders(next);
        setActiveId(next[0].id);
      }
    });
  }

  function requestDeleteItem(item) {
    setConfirmDialog({
      title: "Delete checklist item?",
      message: `This will remove "${item.requirement}" from the current project checklist.`,
      confirmLabel: "Delete Item",
      danger: true,
      onConfirm: () => {
        updateTender({
          checklist: tender.checklist.filter((current) => current.id !== item.id)
        });
      }
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
    const backup = { exportedAt: new Date().toISOString(), tenders };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
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
        setActivePage("projects");
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
      const lines = String(reader.result || "")
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
      const ownerIndex = headers.findIndex((h) => h.includes("owner"));
      const priorityIndex = headers.findIndex((h) => h.includes("priority"));

      if (categoryIndex === -1 || requirementIndex === -1) {
        alert("CSV must include at least Category and Requirement columns.");
        return;
      }

      const importedItems = lines.slice(1).map((line) => {
        const cells = parseCsvLine(line);
        const statusValue = cells[statusIndex]?.trim() || "Not Started";
        const priorityValue = cells[priorityIndex]?.trim() || "Medium";

        return {
          id: crypto.randomUUID(),
          category: cells[categoryIndex]?.trim() || categories[0],
          requirement: cells[requirementIndex]?.trim() || "Untitled requirement",
          mandatory: ["yes", "true", "mandatory", "1"].includes(
            String(cells[mandatoryIndex] || "").trim().toLowerCase()
          ),
          remarks: cells[remarksIndex]?.trim() || "",
          owner: cells[ownerIndex]?.trim() || "Project Team",
          priority: priorities.includes(priorityValue) ? priorityValue : "Medium",
          status: statuses.includes(statusValue) ? statusValue : "Not Started"
        };
      });

      updateTender({ checklist: [...tender.checklist, ...importedItems] });
      e.target.value = "";
    };

    reader.readAsText(file);
  }

  const filteredItems = useMemo(() => {
    return tender.checklist
      .filter((item) => {
        const text = `${item.requirement} ${item.remarks} ${item.owner || ""}`.toLowerCase();
        const matchSearch = text.includes(search.toLowerCase());
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
    const mandatoryOutstanding = tender.checklist.filter((i) => i.mandatory && i.status !== "Completed").length;
    const percentage = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, pendingReview, mandatoryOutstanding, percentage };
  }, [tender]);

  const daysLeft = tender.deadline
    ? Math.ceil((new Date(tender.deadline) - new Date()) / 86400000)
    : null;

  const projectRisk = useMemo(() => {
    if (daysLeft !== null && daysLeft < 0) return risk("Overdue", "red");
    if (analytics.mandatoryOutstanding === 0 && analytics.pendingReview === 0) return risk("Ready", "green");
    if (daysLeft !== null && daysLeft <= 7 && analytics.mandatoryOutstanding > 0) return risk("At Risk", "red");
    if (analytics.pendingReview > 0) return risk("Needs Review", "amber");
    return risk("In Progress", "blue");
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

  const pageTitle = {
    dashboard: "Dashboard",
    checklist: "Checklist",
    projects: "Projects",
    backup: "Backup & Export"
  }[activePage];

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

        <nav className="space-y-2">
          <NavButton icon={<LayoutDashboard size={18} />} label="Dashboard" active={activePage === "dashboard"} onClick={() => setActivePage("dashboard")} />
          <NavButton icon={<ListChecks size={18} />} label="Checklist" active={activePage === "checklist"} onClick={() => setActivePage("checklist")} />
          <NavButton icon={<FolderKanban size={18} />} label="Projects" active={activePage === "projects"} onClick={() => setActivePage("projects")} />
          <NavButton icon={<Archive size={18} />} label="Backup" active={activePage === "backup"} onClick={() => setActivePage("backup")} />
        </nav>

        <button
          onClick={addTender}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-bold text-white hover:bg-blue-800"
        >
          <Plus size={18} />
          New Project
        </button>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Active Project
          </p>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">{tender.name}</p>
            <p className="mt-1 text-xs text-slate-500">{tender.reference}</p>
          </div>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
            <p className="text-sm text-slate-500">Auto-saved locally</p>
          </div>

          <div className="flex gap-2">
            <select
              className="hidden rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 md:block"
              value={activePage}
              onChange={(e) => setActivePage(e.target.value)}
            >
              <option value="dashboard">Dashboard</option>
              <option value="checklist">Checklist</option>
              <option value="projects">Projects</option>
              <option value="backup">Backup</option>
            </select>

            <button
              onClick={requestLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-100"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        <section className="p-5 md:p-8">
          {activePage === "dashboard" && (
            <PageCard>
              <ProjectHeader tender={tender} updateTender={updateTender} uploadLogo={uploadLogo} />

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

              <Stats analytics={analytics} />

              <div className="mb-6 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-blue-700 transition-all" style={{ width: `${analytics.percentage}%` }} />
              </div>

              <CategoryCards categoryStats={categoryStats} />

              <footer className="mt-8 border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
                Project Compliance Management System
              </footer>
            </PageCard>
          )}

          {activePage === "checklist" && (
            <PageCard>
              <ProjectMiniHeader tender={tender} />

              <div className="no-print mb-5 grid gap-3 md:grid-cols-5">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    className="input pl-10"
                    placeholder="Search requirements, remarks or owner..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
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
                    mandatoryOnly ? "bg-red-600 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Mandatory Outstanding
                </button>
              </div>

              <div className="no-print mb-5 flex flex-wrap gap-2">
                <button onClick={addItem} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white">
                  Add Item
                </button>

                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-100">
                  <UploadCloud size={16} />
                  Upload CSV
                  <input type="file" accept=".csv,text/csv" onChange={uploadCsv} className="hidden" />
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
              </div>

              <ChecklistTable
                items={filteredItems}
                updateItem={updateItem}
                setViewItem={setViewItem}
                requestDeleteItem={requestDeleteItem}
              />
            </PageCard>
          )}

          {activePage === "projects" && (
            <PageCard>
              <ProjectHeader tender={tender} updateTender={updateTender} uploadLogo={uploadLogo} />

              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <Field label="Company Name">
                  <input className="input" value={tender.companyName} onChange={(e) => updateTender({ companyName: e.target.value })} />
                </Field>

                <Field label="Project Name">
                  <input className="input" value={tender.name} onChange={(e) => updateTender({ name: e.target.value })} />
                </Field>

                <Field label="Reference Number">
                  <input className="input" value={tender.reference} onChange={(e) => updateTender({ reference: e.target.value })} />
                </Field>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                <button onClick={addTender} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white">
                  New Project
                </button>
                <button onClick={() => requestDeleteProject(tender)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">
                  Delete Current Project
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {tenders.map((project) => {
                  const total = project.checklist.length;
                  const completed = project.checklist.filter((i) => i.status === "Completed").length;
                  const percent = total ? Math.round((completed / total) * 100) : 0;

                  return (
                    <button
                      key={project.id}
                      onClick={() => setActiveId(project.id)}
                      className={`rounded-2xl border p-5 text-left hover:bg-slate-50 ${
                        project.id === tender.id ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"
                      }`}
                    >
                      <p className="font-bold text-slate-900">{project.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{project.reference}</p>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-blue-700" style={{ width: `${percent}%` }} />
                      </div>
                      <p className="mt-2 text-xs font-bold text-slate-500">{percent}% completed</p>
                    </button>
                  );
                })}
              </div>
            </PageCard>
          )}

          {activePage === "backup" && (
            <PageCard>
              <ProjectMiniHeader tender={tender} />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <ActionCard icon={<Download />} title="Export CSV" text="Download the current project checklist as a CSV file." button="Export CSV" onClick={() => exportTenderCsv(tender)} />
                <ActionCard icon={<ClipboardCheck />} title="CSV Template" text="Download a clean template for bulk checklist uploads." button="Download Template" onClick={downloadCsvTemplate} />
                <ActionCard icon={<Database />} title="Backup JSON" text="Export all local projects and checklist data as a backup file." button="Export Backup" onClick={exportBackup} />
                <label className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 hover:bg-slate-50">
                  <Archive className="mb-4 text-blue-700" />
                  <p className="font-bold text-slate-900">Import Backup</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Restore projects from a previous JSON backup file.</p>
                  <div className="mt-5 inline-block rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white">
                    Import Backup
                  </div>
                  <input type="file" accept="application/json" onChange={importBackup} className="hidden" />
                </label>
                <ActionCard icon={<Printer />} title="PDF / Print" text="Open the browser print dialog and save the report as PDF." button="Print / PDF" onClick={() => window.print()} />
              </div>
            </PageCard>
          )}
        </section>
      </main>

      <button
        onClick={addItem}
        className="no-print fixed bottom-5 right-5 rounded-full bg-blue-700 p-4 text-white shadow-soft md:hidden"
      >
        <Plus />
      </button>

      {viewItem && (
        <ViewModal item={viewItem} tender={tender} onClose={() => setViewItem(null)} />
      )}

      {confirmDialog && (
        <ConfirmDialog
          dialog={confirmDialog}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={() => {
            confirmDialog.onConfirm();
            setConfirmDialog(null);
          }}
        />
      )}
    </div>
  );
}

function PageCard({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="print-area rounded-2xl border border-slate-200 bg-white p-5 shadow-soft md:p-7"
    >
      {children}
    </motion.div>
  );
}

function ProjectHeader({ tender, updateTender, uploadLogo }) {
  return (
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
          <input className="w-full text-2xl font-bold text-slate-900 outline-none" value={tender.companyName} onChange={(e) => updateTender({ companyName: e.target.value })} />
          <input className="mt-1 w-full text-sm text-slate-500 outline-none" value={tender.name} onChange={(e) => updateTender({ name: e.target.value })} />
        </div>
      </div>

      <label className="no-print cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-100">
        Upload Logo
        <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
      </label>
    </div>
  );
}

function ProjectMiniHeader({ tender }) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Active Project</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900">{tender.name}</h2>
      <p className="mt-1 text-sm text-slate-500">{tender.companyName} · {tender.reference}</p>
    </div>
  );
}

function ChecklistTable({ items, updateItem, setViewItem, requestDeleteItem }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
        <table className="w-full min-w-[1250px] text-left text-sm">
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
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-200">
                <td className="p-3">
                  <select className="cell" value={item.category} onChange={(e) => updateItem(item.id, { category: e.target.value })}>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </td>
                <td className="p-3">
                  <input className="cell" value={item.requirement} onChange={(e) => updateItem(item.id, { requirement: e.target.value })} />
                </td>
                <td className="p-3">
                  <button onClick={() => updateItem(item.id, { mandatory: !item.mandatory })} className={`rounded-full px-3 py-1 text-xs font-bold ${item.mandatory ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                    {item.mandatory ? "Yes" : "No"}
                  </button>
                </td>
                <td className="p-3">
                  <input className="cell" value={item.remarks} onChange={(e) => updateItem(item.id, { remarks: e.target.value })} />
                </td>
                <td className="p-3">
                  <input className="cell" value={item.owner || ""} onChange={(e) => updateItem(item.id, { owner: e.target.value })} placeholder="Owner" />
                </td>
                <td className="p-3">
                  <select className="cell" value={item.priority || "Medium"} onChange={(e) => updateItem(item.id, { priority: e.target.value })}>
                    {priorities.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </td>
                <td className="p-3">
                  <select className="cell" value={item.status} onChange={(e) => updateItem(item.id, { status: e.target.value })}>
                    {statuses.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="no-print p-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewItem(item)} className="rounded-lg p-2 text-blue-700 hover:bg-blue-50" title="View item">
                      <Eye size={18} />
                    </button>
                    <button onClick={() => requestDeleteItem(item)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Delete item">
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
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <select className="input mb-3" value={item.category} onChange={(e) => updateItem(item.id, { category: e.target.value })}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className="input mb-3 font-bold" value={item.requirement} onChange={(e) => updateItem(item.id, { requirement: e.target.value })} />
            <input className="input mb-3" value={item.remarks} onChange={(e) => updateItem(item.id, { remarks: e.target.value })} placeholder="Remarks" />
            <input className="input mb-3" value={item.owner || ""} onChange={(e) => updateItem(item.id, { owner: e.target.value })} placeholder="Owner" />
            <select className="input mb-3" value={item.priority || "Medium"} onChange={(e) => updateItem(item.id, { priority: e.target.value })}>
              {priorities.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="input" value={item.status} onChange={(e) => updateItem(item.id, { status: e.target.value })}>
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>

            <div className="mt-3 flex gap-2">
              <button onClick={() => setViewItem(item)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white">
                <Eye size={16} /> View
              </button>
              <button onClick={() => requestDeleteItem(item)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Stats({ analytics }) {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-5">
      <Stat label="Total Items" value={analytics.total} />
      <Stat label="Completed" value={analytics.completed} />
      <Stat label="Pending" value={analytics.pending} />
      <Stat label="Mandatory Outstanding" value={analytics.mandatoryOutstanding} danger />
      <Stat label="Completion" value={`${analytics.percentage}%`} />
    </div>
  );
}

function CategoryCards({ categoryStats }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {categoryStats.map((item) => (
        <div key={item.category} className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{item.category}</p>
          <p className="mt-2 text-lg font-bold text-slate-900">{item.completed}/{item.total} completed</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-blue-700" style={{ width: `${item.percentage}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${
        active ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ActionCard({ icon, title, text, button, onClick }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 text-blue-700">{icon}</div>
      <p className="font-bold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
      <button onClick={onClick} className="mt-5 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">
        {button}
      </button>
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

function ViewModal({ item, tender, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Checklist Item</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{item.requirement}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" title="Close">
            <X size={22} />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Detail label="Category" value={item.category} />
          <Detail label="Status" value={item.status} />
          <Detail label="Mandatory" value={item.mandatory ? "Yes" : "No"} />
          <Detail label="Owner" value={item.owner || "Project Team"} />
          <Detail label="Priority" value={item.priority || "Medium"} />
          <Detail label="Project Reference" value={tender.reference || "-"} />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Remarks / Notes</p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{item.remarks || "No remarks added."}</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ConfirmDialog({ dialog, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${dialog.danger ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{dialog.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{dialog.message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">
            Cancel
          </button>
          <button onClick={onConfirm} className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white ${dialog.danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-700 hover:bg-blue-800"}`}>
            {dialog.confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function risk(label, color) {
  const styles = {
    red: "bg-red-100 text-red-700 border-red-200",
    green: "bg-green-100 text-green-700 border-green-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200"
  };

  return { label, className: styles[color] };
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
