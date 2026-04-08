// src/components/Reports.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee,
  Package,
  Layers,
  Clock,
  ChevronRight,
  Box,
  Zap,
  TrendingUp,
  Activity
} from "lucide-react";

/* ── SUB-COMPONENTS ─────────────────────────────────────────── */

function MetricCard({ label, value, trend, icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-colors"
    >
      <div className="flex justify-between items-start mb-5">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold">
            <TrendingUp size={12} />
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">{label}</p>
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{value}</h3>
      </div>
    </motion.div>
  );
}

function ProgressRow({ label, value, unit, color = "bg-white", delay = 0 }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[11px] font-bold tracking-wider uppercase">
        <span className="text-indigo-100/70">{label}</span>
        <span className="text-white">{value} <span className="text-[9px] opacity-60 ml-0.5">{unit}</span></span>
      </div>
      <div className="h-2 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "85%" }}
          transition={{ delay: delay + 0.3, duration: 1, ease: "circOut" }}
          className={`h-full ${color} rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)]`}
        />
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ─────────────────────────────────────────── */

export default function Reports() {
  const [invoices, setInvoices] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all for totals and specifically ordered recent for list
      const [allSnap, recentSnap] = await Promise.all([
        getDocs(collection(db, "invoices")),
        getDocs(query(collection(db, "invoices"), orderBy("date", "desc"), limit(15)))
      ]);

      const allData = allSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setInvoices(allData.filter(i => !i.isDeleted));

      const filteredRecent = recentSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(i => !i.isDeleted)
        .slice(0, 5);
      setRecentInvoices(filteredRecent);
    } catch (error) {
      console.error("Dashboard Sync Failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalGrams = 0;
    let designTime = 0;
    let printTime = 0;
    let developmentTime = 0;

    invoices.forEach(i => {
      totalRevenue += Number(i.total || 0);
      totalGrams += Number(i.grams || 0);
      designTime += Number(i.designTime || 0);
      printTime += Number(i.printTime || 0);
      developmentTime += Number(i.developmentTime || 0);
    });

    return {
      totalRevenue,
      totalGrams,
      orderCount: invoices.length,
      designTime,
      printTime,
      developmentTime,
      averageTicket: invoices.length ? totalRevenue / invoices.length : 0
    };
  }, [invoices]);

  if (loading)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <Zap size={24} className="absolute inset-0 m-auto text-indigo-600 animate-pulse" />
        </div>
        <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-[0.3em] mt-6">Syncing Intelligence</p>
      </div>
    );

  return (
    <div className="w-full space-y-10 py-4">
      {/* HEADER SECTION */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Dashboard <span className="text-indigo-600 font-black">.</span>
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-widest">Analytics & Insights</p>
        </div>

        <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-5 py-3 rounded-2xl border border-white dark:border-slate-800 shadow-sm transition-colors">
          <Activity size={16} className="text-indigo-500" />
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{stats.orderCount} Total Records</span>
        </div>
      </header>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <MetricCard
          label="Gross Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          trend="Real-time"
          icon={<IndianRupee size={22} />}
          delay={0}
        />
        <MetricCard
          label="Material Usage"
          value={`${stats.totalGrams.toLocaleString()}g`}
          trend="Verified"
          icon={<Layers size={22} />}
          delay={0.1}
        />
        <MetricCard
          label="Avg Ticket"
          value={`₹${stats.averageTicket.toLocaleString()}`}
          icon={<Zap size={22} />}
          delay={0.2}
        />
      </div>

      {/* RECENT ACTIVITY & TIME DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">

        {/* Main Table Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-[2.5rem] border border-white dark:border-slate-800 shadow-[0_8px_40px_rgba(0,0,0,0.04)] overflow-hidden transition-colors">
            <div className="px-8 py-7 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20 transition-colors">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <Box size={20} className="text-indigo-500" />
                Recent Projects
              </h3>
            </div>
            
            {/* Mobile: Cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/50">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">{inv.customer}</h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black mt-1">{inv.date}</p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-xs">
                      ₹{(inv.total || 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 italic">
                    <ChevronRight size={14} className="text-indigo-500" />
                    {inv.model}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] transition-colors">
                  <tr>
                    <th className="px-8 py-5">Customer</th>
                    <th className="px-6 py-5">Model</th>
                    <th className="px-6 py-5 text-right">Amount</th>
                    <th className="px-8 py-5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 transition-colors">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                      <td className="px-8 py-5 font-bold text-slate-700 dark:text-slate-300 text-sm">{inv.customer}</td>
                      <td className="px-6 py-5">
                        <span className="text-slate-500 dark:text-slate-400 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{inv.model}</span>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-slate-100 text-sm">₹{(inv.total || 0).toLocaleString()}</td>
                      <td className="px-8 py-5 text-right text-slate-400 dark:text-slate-500 text-[10px] font-bold">{inv.date}</td>
                    </tr>
                  ))}
                  {recentInvoices.length === 0 && (
                    <tr><td colSpan="4" className="px-8 py-10 text-center text-slate-400 italic text-sm">No recent activity detected.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Info Section */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group"
          >
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative space-y-8">
              <div className="flex items-center gap-3">
                <Clock className="text-indigo-200" size={20} />
                <p className="text-indigo-100 text-[11px] font-black uppercase tracking-[0.2em]">Efficiency Breakdown</p>
              </div>

              <div className="space-y-7">
                <ProgressRow label="Printing Production" value={stats.printTime} unit="hr" color="bg-white" delay={0.1} />
                <ProgressRow label="Conceptual Design" value={stats.designTime} unit="hr" color="bg-indigo-300" delay={0.2} />
                <ProgressRow label="Technical Dev" value={stats.developmentTime} unit="hr" color="bg-indigo-100" delay={0.3} />
              </div>

              <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Total Energy</span>
                <span className="text-xl font-black">{(stats.printTime + stats.designTime + stats.developmentTime).toFixed(1)} <span className="text-xs opacity-60">HRS</span></span>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}