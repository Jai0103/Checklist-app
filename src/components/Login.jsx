import { useState } from "react";
import { motion } from "framer-motion";
import { LockKeyhole } from "lucide-react";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();

    if (form.username === "admin" && form.password === "tender2026") {
      localStorage.setItem("auth", JSON.stringify(true));
      onLogin();
      return;
    }

    setError("Invalid username or password.");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl md:grid-cols-[1.05fr_0.95fr]"
        >
<section className="hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-10 md:flex md:flex-col md:justify-between">
  <div>
    <div className="mb-10 flex h-20 w-48 items-center justify-center rounded-2xl bg-white p-4 shadow-xl shadow-black/20">
      <img
        src="./AGA_Logo_fullcolor_Horizontal.png"
        alt="AGA Company Logo"
        className="h-full w-full object-contain"
      />
    </div>

    <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-blue-200">
      Internal Tender Control
    </p>

    <h1 className="max-w-md text-4xl font-bold leading-tight text-white">
      Tender submission readiness, organized in one secure workspace.
    </h1>

    <p className="mt-5 max-w-md text-sm leading-6 text-blue-100/80">
      Track mandatory documents, technical requirements, commercial items,
      compliance evidence, approvals, and final submission status before every deadline.
    </p>
  </div>

  <div>
    <div className="grid grid-cols-3 gap-3 text-xs text-blue-100/85">
      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
        <strong className="mb-1 block text-white">Checklist</strong>
        Structured tender requirements
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
        <strong className="mb-1 block text-white">Compliance</strong>
        Mandatory item tracking
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
        <strong className="mb-1 block text-white">Deadline</strong>
        Submission readiness view
      </div>
    </div>

    <p className="mt-6 text-xs leading-5 text-blue-100/60">
      Private frontend-only system. Data is stored locally in this browser.
    </p>
  </div>
</section>

          <form onSubmit={submit} className="bg-white p-8 text-slate-900 md:p-12">
            <div className="mb-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-700/20">
                <LockKeyhole size={28} />
              </div>

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                Authorized Access Only
              </p>

              <h2 className="text-3xl font-bold tracking-tight">
                Sign in to dashboard
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Tender Submission Management System
              </p>
            </div>

            <label className="text-sm font-bold text-slate-700">Username</label>
            <input
              className="input mt-2 mb-5"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Enter username"
            />

            <label className="text-sm font-bold text-slate-700">Password</label>
            <input
              type="password"
              className="input mt-2"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter password"
            />

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <button className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3.5 font-bold text-white shadow-lg shadow-blue-700/20 hover:bg-blue-800">
              <LockKeyhole size={18} />
              Login
            </button>

            <p className="mt-6 text-center text-xs text-slate-400">
              Frontend-only access gate. Data is stored in this browser.
            </p>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
