import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

/* ── Toast Component ────────────────────────────────────────── */
export function Toast({ message, type, onClose }) {
  const isSuccess = type === "success";
  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-xl transition-colors
        ${isSuccess
          ? "bg-emerald-50/90 border-emerald-200 text-emerald-800 dark:bg-emerald-900/90 dark:border-emerald-800 dark:text-emerald-100"
          : "bg-red-50/90 border-red-200 text-red-800 dark:bg-red-900/90 dark:border-red-800 dark:text-red-100"
        }`}
    >
      {isSuccess ? (
        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
      ) : (
        <AlertCircle size={20} className="text-red-500 shrink-0" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition text-lg leading-none">
        ×
      </button>
    </motion.div>
  );
}

/* ── Section Label ──────────────────────────────────────────── */
export function SectionLabel({ text }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        {text}
      </h3>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent" />
    </div>
  );
}

/* ── Form Field ─────────────────────────────────────────────── */
export function FormField({ icon, label, placeholder, value, onChange, type = "text", options = [], error }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
        {type === "select" ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full pl-11 pr-10 py-3 rounded-xl border-2 text-sm bg-slate-50/50 dark:bg-slate-800/50 dark:text-slate-200
              transition-all duration-200 outline-none appearance-none cursor-pointer
              ${error
                ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50 dark:focus:ring-red-900/20"
                : "border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 text-sm bg-slate-50/50 dark:bg-slate-800/50 dark:text-slate-200
              transition-all duration-200 outline-none placeholder:dark:text-slate-600
              ${error
                ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50 dark:focus:ring-red-900/20"
                : "border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
          />
        )}
        {type === "select" && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}
