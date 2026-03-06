// src/components/InvoiceTable.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, FileSpreadsheet, Edit3, Trash2, Database, Loader2, X } from "lucide-react";
import { db } from "../firebase/config";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import * as XLSX from "xlsx";

export default function InvoiceTable() {
  const [invoices, setInvoices] = useState([]);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* FETCH */
  const fetchInvoices = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "invoices"));
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  /* FILTER */
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv =>
      inv.customer?.toLowerCase().includes(search.toLowerCase())
    );
  }, [invoices, search]);

  /* EXCEL */
  const downloadExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(invoices);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Invoices");
    XLSX.writeFile(book, "Invoice_Data.xlsx");
  };

  /* DELETE */
  const deleteInvoice = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    try {
      await deleteDoc(doc(db, "invoices", id));
      setInvoices(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.error("Error deleting document: ", e);
    }
  };

  /* UPDATE */
  const saveUpdate = async () => {
    const { id, ...rest } = editData;
    const payload = {
      ...rest,
      grams: Number(editData.grams),
      price: Number(editData.price),
      developmentTime: Number(editData.developmentTime) || 0,
      total: Number(editData.grams) * Number(editData.price)
    };

    try {
      await updateDoc(doc(db, "invoices", id), payload);
      setInvoices(prev =>
        prev.map(i => (i.id === id ? { id, ...payload } : i))
      );
      setEditData(null);
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm">
        <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
        <p className="text-slate-500 text-sm font-medium">Loading History...</p>
      </div>
    );

  return (
    <div className="w-full">
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-6 sm:p-8 border border-white/50 overflow-hidden">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <Database size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Invoice History
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">Manage and track your 3D print records</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:min-w-[300px]">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search by customer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 
                focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm"
              />
            </div>

            <button
              onClick={downloadExcel}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 
              text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 transition-all sm:w-auto w-full group"
            >
              <FileSpreadsheet size={18} className="group-hover:scale-110 transition-transform" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* MOBILE CARDS VIEW (md:hidden) */}
        <div className="md:hidden space-y-4">
          {filteredInvoices.map(inv => (
            <div key={inv.id} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{inv.customer}</h3>
                  <p className="text-slate-500 text-xs mt-0.5">{inv.model} • {inv.filament}</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  ₹{inv.total}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 text-[11px] text-slate-500">
                <div className="flex justify-between items-center bg-white/50 p-2.5 rounded-lg border border-slate-50">
                  <span className="text-slate-400 font-medium uppercase">Design / Print / Dev</span>
                  <span className="text-slate-700 font-semibold">{inv.designTime}m / {inv.printTime}h / {inv.developmentTime}h</span>
                </div>
                <div className="flex justify-between items-center bg-white/50 p-2.5 rounded-lg border border-slate-50">
                  <span className="text-slate-400 font-medium uppercase">Weight / Price</span>
                  <span className="text-slate-700 font-semibold">{inv.grams}g / ₹{inv.price}</span>
                </div>
                <div className="flex justify-between items-center bg-white/50 p-2.5 rounded-lg border border-slate-50">
                  <span className="text-slate-400 font-medium uppercase">Payment Mode</span>
                  <span className="text-slate-700 font-semibold">{inv.paymentMode || "Cash"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                <span className="text-[10px] text-slate-400">{inv.date}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditData(inv)}
                    className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-100 shadow-sm"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => deleteInvoice(inv.id)}
                    className="p-2 bg-white text-slate-400 hover:text-red-500 rounded-lg border border-slate-100 shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredInvoices.length === 0 && (
            <div className="p-8 text-center text-slate-400 italic text-sm">No records found.</div>
          )}
        </div>

        {/* DESKTOP TABLE VIEW (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/30">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
              <tr>
                {["Customer", "Model", "Filament", "Design", "Print", "Dev", "Grams", "Price", "Total", "Payment", "Date", "Actions"].map(h => (
                  <th key={h} className="px-6 py-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="bg-white/40 hover:bg-indigo-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-800">{inv.customer}</td>
                  <td className="px-6 py-4 text-slate-600">{inv.model}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
                      {inv.filament}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{inv.designTime}m</td>
                  <td className="px-6 py-4 text-slate-500">{inv.printTime}h</td>
                  <td className="px-6 py-4 text-slate-500">{inv.developmentTime}h</td>
                  <td className="px-6 py-4 text-slate-500">{inv.grams}g</td>
                  <td className="px-6 py-4 text-slate-500">₹{inv.price}</td>
                  <td className="px-6 py-4 font-bold text-indigo-600">₹{inv.total}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${inv.paymentMode === "UPI" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                      }`}>
                      {inv.paymentMode || "Cash"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{inv.date}</td>
                  <td className="px-6 py-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditData(inv)}
                      className="p-2 bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all border border-slate-100 shadow-sm"
                      title="Edit"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => deleteInvoice(inv.id)}
                      className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all border border-slate-100 shadow-sm"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-slate-400 italic">
                    No records matched your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Edit Record</h3>
              <button onClick={() => setEditData(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Customer</label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm"
                  value={editData.customer}
                  onChange={e => setEditData({ ...editData, customer: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Grams</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm"
                    value={editData.grams}
                    onChange={e => setEditData({ ...editData, grams: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rate</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm"
                    value={editData.price}
                    onChange={e => setEditData({ ...editData, price: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Development Time (Hrs)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm"
                  value={editData.developmentTime}
                  onChange={e => setEditData({ ...editData, developmentTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Payment Mode</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm bg-white appearance-none cursor-pointer"
                  value={editData.paymentMode || "Cash"}
                  onChange={e => setEditData({ ...editData, paymentMode: e.target.value })}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
            </div>


            <div className="p-6 flex gap-3 bg-slate-50/50 border-t border-slate-100">
              <button
                onClick={() => setEditData(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={saveUpdate}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-100 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}