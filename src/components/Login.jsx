import { useState } from "react";
import { motion } from "framer-motion";
import { LockKeyhole, ShieldCheck } from "lucide-react";

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
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-soft"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-900 text-white">
            <ShieldCheck size={34} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Authorized Access Only</h1>
          <p className="mt-2 text-sm text-slate-500">
            Tender Submission Management System
          </p>
        </div>

        <label className="text-sm font-semibold text-slate-700">Username</label>
        <input
          className="mt-2 mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="admin"
        />

        <label className="text-sm font-semibold text-slate-700">Password</label>
        <input
          type="password"
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="tender2026"
        />

        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

        <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-bold text-white hover:bg-blue-800">
          <LockKeyhole size={18} />
          Login
        </button>
      </motion.form>
    </main>
  );
}
