// src/components/Reports.jsx
import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  IndianRupee,
  Package,
  Layers,
  Clock,
  ChevronRight,
  Box,
  Zap
} from "lucide-react";

export default function Reports() {
  const [invoices, setInvoices] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allSnap = await getDocs(collection(db, "invoices"));
        const allData = allSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setInvoices(allData);

        const recentSnap = await getDocs(query(collection(db, "invoices"), orderBy("date", "desc"), limit(5)));
        setRecentInvoices(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching repo data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#fafbfc] px-4 py-8 sm:px-10">
      <div className="max-w-7xl mx-auto">

        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
              Financial <span className="text-slate-400 font-light">Overview</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-3">Total</span>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-600 px-2">{stats.orderCount} Jobs</span>
          </div>
        </header>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <MetricCard
            label="Gross Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            trend="+14.2%"
            icon={<IndianRupee size={18} />}
          />
          <MetricCard
            label="Material Usage"
            value={`${stats.totalGrams.toLocaleString()}g`}
            trend="+5.1%"
            icon={<Layers size={18} />}
          />
          <MetricCard
            label="Production Time"
            value={`${stats.printTime}h`}
            icon={<Clock size={18} />}
          />
        </div>

        {/* RECENT ACTIVITY & TIME DISTRIBUTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Table Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Box size={18} className="text-indigo-500" />
                  Recent Jobs
                </h3>
                <button className="text-indigo-600 text-xs font-bold hover:underline">View All Records</button>
              </div>
              {/* Mobile View: Cards */}
              <div className="md:hidden divide-y divide-slate-50">
                {recentInvoices.map((inv, idx) => (
                  <div key={inv.id || idx} className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800 text-sm">{inv.customer}</span>
                      <span className="text-xs font-medium text-slate-400">{inv.date}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium truncate max-w-[150px]">{inv.model}</span>
                      <span className="font-bold text-indigo-600">₹{inv.total}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    <tr>
                      <th className="px-8 py-4">Customer</th>
                      <th className="px-6 py-4">Model</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-8 py-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentInvoices.map((inv, idx) => (
                      <tr key={inv.id || idx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-4 font-bold text-slate-700 text-sm whitespace-nowrap">{inv.customer}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm truncate max-w-[150px]">{inv.model}</td>
                        <td className="px-6 py-4 font-bold text-slate-900 text-sm">₹{inv.total}</td>
                        <td className="px-8 py-4 text-slate-400 text-xs font-medium text-right whitespace-nowrap">{inv.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Info Section */}
          <div className="space-y-6">
            <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative">
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-6">Summary</p>
                <div className="space-y-6">
                  <ProgressRow label="Printing" value={stats.printTime} unit="hr" />
                  <ProgressRow label="Design" value={stats.designTime} unit="min" />
                  <ProgressRow label="Development" value={stats.developmentTime} unit="hr" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── COMPONENTS ─────────────────────────────────────────── */

function MetricCard({ label, value, trend, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl font-black text-slate-800">{value}</h3>
      </div>
    </motion.div>
  );
}

function ProgressRow({ label, value, unit }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-2">
        <span>{label}</span>
        <span className="opacity-70">{value}{unit}</span>
      </div>
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "70%" }}
          className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.4)]"
        />
      </div>
    </div>
  );
}