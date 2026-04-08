import { useState, useEffect } from "react";
import { Menu, X, FileText, BarChart3 } from "lucide-react";
import InvoiceForm from "./components/InvoiceForm"
import InvoiceTable from "./components/InvoiceTable";
import Reports from "./components/Reports";
import ThemeToggle from "./components/ThemeToggle";

export default function App() {
  const [showReports, setShowReports] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = showReports ? "hidden" : "auto";
  }, [showReports]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-violet-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-500">

      {/* SIDEBAR — desktop */}
      <aside className="w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-indigo-100 dark:border-slate-800 shadow-sm p-6 hidden md:flex flex-col shrink-0 transition-colors">
        <div className="mb-10 flex flex-col items-center gap-4">
          <img src="/logo.jpg" alt="KITS Logo" className="h-16 w-auto object-contain drop-shadow-md dark:brightness-110" />
        </div>

        <nav className="space-y-4 text-slate-600 dark:text-slate-400">
          <button className="w-full text-left font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <FileText size={18} /> Invoices
          </button>

          <button
            onClick={() => setShowReports(true)}
            className="w-full text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-2"
          >
            <BarChart3 size={18} /> Reports
          </button>
        </nav>

        <div className="mt-auto">
          <ThemeToggle className="w-full justify-center gap-2 mb-3" />
          <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <img src="/logo.jpg" alt="KITS Logo" className="h-7 w-7 object-contain rounded-md opacity-80 dark:brightness-110" />
            <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-tight">
              KITS Tech Solutions<br />© 2026
            </p>
          </div>
        </div>
      </aside>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-64 h-full bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center justify-center mb-8 relative">
              <img src="/logo.jpg" alt="KITS Logo" className="h-14 w-auto object-contain drop-shadow-md dark:brightness-110" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-0 top-0 p-1"
              >
                <X size={22} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <nav className="space-y-4 text-slate-600 dark:text-slate-400">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2"
              >
                <FileText size={18} /> Invoices
              </button>

              <button
                onClick={() => { setShowReports(true); setMobileMenuOpen(false); }}
                className="w-full text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-2"
              >
                <BarChart3 size={18} /> Reports
              </button>
            </nav>

            <div className="mt-auto">
              <ThemeToggle className="w-full justify-center gap-2 mb-3" />
              <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <img src="/logo.jpg" alt="KITS Logo" className="h-7 w-7 object-contain rounded-md opacity-80 dark:brightness-110" />
                <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-tight">
                  KITS Tech Solutions<br />© 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className={`flex-1 min-w-0 transition ${showReports ? "blur-sm" : ""}`}>

        {/* HEADER */}
        <header className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-indigo-100 dark:border-slate-800 shadow-sm px-4 py-3 sm:p-4 flex justify-between items-center gap-3 transition-colors">

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
          >
            <Menu size={22} className="text-slate-600 dark:text-slate-400" />
          </button>

          {/* Mobile Center Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden flex items-center gap-3">
            <img src="/logo.jpg" alt="KITS" className="h-8 w-auto object-contain drop-shadow-sm dark:brightness-110" />
          </div>

          <h2 className="hidden md:block text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-200 truncate uppercase tracking-wide">
            KITS Invoice System
          </h2>

          <div className="flex items-center gap-2">
            <button 
              onClick={async () => {
                try {
                  const demoRef = collection(db, "connection_test");
                  await addDoc(demoRef, { timestamp: new Date().toISOString() });
                  alert("✅ Firebase connection successful! Permissions are working.");
                } catch (e) {
                  console.error("Firebase Test Error:", e);
                  alert(`❌ Connection Failed: ${e.message}\n\nCheck your Firebase Console Rules and Project ID in .env`);
                }
              }}
              className="text-[10px] font-bold px-3 py-1.5 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-slate-700 hover:bg-white transition-all mr-2"
            >
              Test Connection
            </button>
            <ThemeToggle className="md:hidden" />
            <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 whitespace-nowrap">
              Admin
            </span>
          </div>

          {/* Gradient Accent Line */}
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500" />
        </header>

        {/* CONTENT */}
        <div className="relative px-3 py-6 sm:px-6 sm:py-8 lg:p-10 max-w-7xl mx-auto space-y-6 sm:space-y-10">

          {/* Soft Glow */}
          <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-br from-indigo-200/20 via-blue-200/20 to-violet-200/20 dark:from-indigo-900/10 dark:via-blue-900/10 dark:to-violet-900/10 blur-3xl -z-10" />

          <InvoiceForm />
          <InvoiceTable />
        </div>
      </main>

      <div
        className={`fixed top-0 right-0 h-full w-full bg-white dark:bg-slate-950 z-50 overflow-y-auto
        transform transition-transform duration-300 ease-in-out
        ${showReports ? "translate-x-0" : "translate-x-full"}`}
      >
        <button
          onClick={() => setShowReports(false)}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition z-10"
        >
          <X size={20} />
        </button>

        <Reports />
      </div>
    </div>
  );
}
