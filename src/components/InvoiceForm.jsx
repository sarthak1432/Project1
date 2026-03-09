// src/components/InvoiceForm.jsx
import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  User,
  Clock,
  Printer,
  Box,
  Droplets,
  Scale,
  DollarSign,
  Download,
  AlertCircle,
  Phone,
  Loader2,
  CheckCircle2,
  Zap,
  Plus,
  Trash2,
  Paperclip,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import generatePDF from "../utils/generatePDF";

/* FIRESTORE */
import { db } from "../firebase/config";
import { collection, addDoc, doc, runTransaction } from "firebase/firestore";

/* ── Constants ──────────────────────────────────────────────── */
const FILAMENT_OPTIONS = ["PLA", "ABS", "PETG", "TPU"];

const initialState = {
  customer: "",
  designTime: "",
  printTime: "",
  model: "",
  filament: "",
  grams: "",
  ratePerGram: "",
  clientPhone: "",
  developmentTime: "",
  accessories: [],
  extraCost: "",
  paymentMode: "Cash",
  addGST: "No",
  customerGST: "",
};

/* ── Toast Component ────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
  const isSuccess = type === "success";
  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-xl
        ${isSuccess
          ? "bg-emerald-50/90 border-emerald-200 text-emerald-800"
          : "bg-red-50/90 border-red-200 text-red-800"
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

/* ── Main Component ─────────────────────────────────────────── */
export default function InvoiceForm() {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  /* TOTAL */
  const total = useMemo(() => {
    const gramCost = (Number(formData.grams) || 0) * (Number(formData.ratePerGram) || 0);
    const extra = Number(formData.extraCost) || 0;
    return gramCost + extra;
  }, [formData.grams, formData.ratePerGram, formData.extraCost]);

  /* UPDATE FIELD */
  const updateField = useCallback((name, value) => {
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  }, []);

  const addAccessory = () => {
    setFormData(p => ({ ...p, accessories: [...p.accessories, ""] }));
  };

  const updateAccessory = (index, val) => {
    const next = [...formData.accessories];
    next[index] = val;
    setFormData(p => ({ ...p, accessories: next }));
  };

  const removeAccessory = (index) => {
    setFormData(p => ({ ...p, accessories: p.accessories.filter((_, i) => i !== index) }));
  };

  /* VALIDATION */
  const validate = () => {
    const e = {};
    if (!formData.customer.trim()) e.customer = "Customer name is required";
    if (!formData.model.trim()) e.model = "Model name is required";
    if (!formData.filament) e.filament = "Select a filament type";
    if ((Number(formData.grams) || 0) <= 0) e.grams = "Enter valid weight";
    if ((Number(formData.ratePerGram) || 0) <= 0) e.ratePerGram = "Enter valid rate";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => setFormData(initialState);

  const buildFilename = () => {
    const date = new Date().toISOString().slice(0, 10);
    return `Invoice_${formData.customer.replace(/\s+/g, "_")}_${date}.pdf`;
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* SAVE + PDF */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      let invoiceNumber = 1;

      // ATOMIC TRANSACTION TO GET SEQUENTIAL INVOICE NUMBER
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, "metadata", "counters");
        const counterSnap = await transaction.get(counterRef);

        if (!counterSnap.exists()) {
          transaction.set(counterRef, { lastInvoiceNumber: 1 });
          invoiceNumber = 1;
        } else {
          const newNum = (counterSnap.data().lastInvoiceNumber || 0) + 1;
          transaction.update(counterRef, { lastInvoiceNumber: newNum });
          invoiceNumber = newNum;
        }
      });

      const subtotal = (Number(formData.grams) * Number(formData.ratePerGram)) + Number(formData.extraCost || 0);
      const gstAmount = formData.addGST === "Yes" ? subtotal * 0.18 : 0;
      const total = subtotal + gstAmount;

      const payload = {
        ...formData,
        invoiceNumber,
        customerGST: formData.customerGST,
        grams: Number(formData.grams) || 0,
        price: Number(formData.ratePerGram) || 0,
        extraCost: Number(formData.extraCost) || 0,
        developmentTime: Number(formData.developmentTime) || 0,
        addGST: formData.addGST,
        gstAmount,
        subtotal,
        total,
        date: new Date().toLocaleDateString(),
      };

      /* SAVE FIRESTORE */
      await addDoc(collection(db, "invoices"), payload);

      /* PDF */
      const blob = await generatePDF(payload);
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;


      
      a.download = buildFilename();
      a.click();

      URL.revokeObjectURL(url);
      resetForm();
      setErrors({});
      showToast("Invoice saved & PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to save invoice. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="bg-white/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white/50 overflow-hidden">

          {/* ── Header ─────────────────────────────────── */}
          <div className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-5 py-5 sm:px-8 sm:py-7">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoNnptMC0zMHY2aC02VjRoNnptMCAxMnY2aC02VjE2aDZ6bTAgMTJ2Nmg2djZoLTZ2LTZ6bTEyLTI0djZoLTZWNGg2em0wIDEydjZoLTZWMTZoNnptMCAxMnY2aC02VjI4aDZ6bS0yNC0yNHY2SDEyVjRoNnptMCAxMnY2SDEyVjE2aDZ6bTAgMTJ2NkgxMlYyOGg2em0wIDEydjZIMTJWNDBoNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
            <div className="relative flex items-center gap-4">
              <div className="p-2.5 sm:p-3 bg-white/15 rounded-2xl backdrop-blur-sm">
                <FileText size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  New Invoice
                </h1>

              </div>
            </div>
          </div>

          {/* ── Form Body ──────────────────────────────── */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6 sm:space-y-7">

            {/* Section: Customer Info */}
            <section>
              <SectionLabel text="Customer Information" />
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                <FormField
                  icon={<User size={18} />}
                  label="Customer Name"
                  placeholder="Enter customer name"
                  value={formData.customer}
                  onChange={(v) => updateField("customer", v)}
                  error={errors.customer}
                />
                <FormField
                  icon={<Phone size={18} />}
                  label="Customer Phone"
                  placeholder="Enter phone number"
                  value={formData.clientPhone}
                  onChange={(v) => updateField("clientPhone", v)}
                />
              </div>
            </section>

            {/* Section: Job Details */}
            <section>
              <SectionLabel text="Job Details" />
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                <FormField
                  icon={<Box size={18} />}
                  label="Model Name"
                  placeholder="e.g. Phone Stand"
                  value={formData.model}
                  onChange={(v) => updateField("model", v)}
                  error={errors.model}
                />

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Filament Type
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Droplets size={18} />
                    </div>
                    <select
                      value={formData.filament}
                      onChange={(e) => updateField("filament", e.target.value)}
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 text-sm bg-slate-50/50
                        transition-all duration-200 outline-none appearance-none cursor-pointer
                        ${errors.filament
                          ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
                          : "border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 hover:border-slate-300"
                        }`}
                    >
                      <option value="">Select filament...</option>
                      {FILAMENT_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  {errors.filament && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.filament}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Section: Time */}
            <section>
              <SectionLabel text="Time Estimates" />
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                <FormField
                  icon={<Clock size={18} />}
                  label="Design Time"
                  placeholder="Minutes"
                  type="number"
                  value={formData.designTime}
                  onChange={(v) => updateField("designTime", v)}
                />
                <FormField
                  icon={<Printer size={18} />}
                  label="Print Time"
                  placeholder="Hours"
                  type="number"
                  value={formData.printTime}
                  onChange={(v) => updateField("printTime", v)}
                />
              </div>
            </section>

            {/* Section: Pricing */}
            <section>
              <SectionLabel text="Pricing" />
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                <FormField
                  icon={<Scale size={18} />}
                  label="Filament Used"
                  placeholder="Grams"
                  type="number"
                  value={formData.grams}
                  onChange={(v) => updateField("grams", v)}
                  error={errors.grams}
                />
                <FormField
                  icon={<span className="text-[10px] font-bold">INR</span>}
                  label="Rate per Gram"
                  placeholder="₹ per gram"
                  type="number"
                  value={formData.ratePerGram}
                  onChange={(v) => updateField("ratePerGram", v)}
                  error={errors.ratePerGram}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-5">
                <FormField
                  icon={<Zap size={18} />}
                  label="Development Time (Hrs)"
                  placeholder="Enter dev hours"
                  type="number"
                  value={formData.developmentTime}
                  onChange={(v) => updateField("developmentTime", v)}
                />
                <FormField
                  icon={<IndianRupee size={16} />}
                  label="Add GST?"
                  type="select"
                  placeholder="Select"
                  value={formData.addGST}
                  options={["No", "Yes"]}
                  onChange={(v) => updateField("addGST", v)}
                />
              </div>

              {formData.addGST === "Yes" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 sm:mt-5"
                >
                  <FormField
                    icon={<FileText size={18} />}
                    label="Customer GST Number"
                    placeholder="Enter customer GSTIN (Optional)"
                    value={formData.customerGST}
                    onChange={(v) => updateField("customerGST", v)}
                  />
                </motion.div>
              )}
            </section>

            {/* Section: Accessories */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <SectionLabel text="Additional Accessories" />
                <button
                  type="button"
                  onClick={addAccessory}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {formData.accessories.map((acc, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx}
                    className="flex gap-2"
                  >
                    <div className="relative flex-1">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Paperclip size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 4x M3 Screws"
                        value={acc}
                        onChange={(e) => updateAccessory(idx, e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-100 text-sm bg-slate-50/30 outline-none focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAccessory(idx)}
                      className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
                {formData.accessories.length === 0 && (
                  <p className="text-center py-4 text-slate-400 text-xs italic border-2 border-dashed border-slate-100 rounded-2xl">
                    No accessories added. Click "Add Item" to include extra parts.
                  </p>
                )}
              </div>
            </section>

            {/* Section: Extra Charges */}
            <section>
              <SectionLabel text="Extra Charges" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <FormField
                  icon={<DollarSign size={18} />}
                  label="Extra Cost (INR)"
                  placeholder="₹ Manual additional cost"
                  type="number"
                  value={formData.extraCost}
                  onChange={(v) => updateField("extraCost", v)}
                />
                <FormField
                  icon={<CreditCard size={18} />}
                  label="Payment Mode"
                  type="select"
                  value={formData.paymentMode}
                  options={["Cash", "UPI"]}
                  onChange={(v) => updateField("paymentMode", v)}
                />
              </div>
            </section>

            {/* ── Total ────────────────────────────────── */}
            <motion.div
              layout
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 p-5 sm:p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Final Amount
                  </p>
                  <motion.p
                    key={total}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight"
                  >
                    INR {total.toFixed(2)}
                  </motion.p>
                </div>
                <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                  <span className="text-white/80 font-bold text-lg">INR</span>
                </div>
              </div>
            </motion.div>

            {/* ── Submit ───────────────────────────────── */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading ? {} : { scale: 1.01 }}
              whileTap={loading ? {} : { scale: 0.99 }}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-semibold text-base
                shadow-lg transition-all duration-300
                ${loading
                  ? "bg-slate-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 hover:shadow-indigo-200 hover:shadow-xl cursor-pointer"
                }`}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Save & Download PDF
                </>
              )}
            </motion.button>

          </form>
        </div>
      </motion.div>
    </>
  );
}

/* ── Section Label ──────────────────────────────────────────── */
function SectionLabel({ text }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        {text}
      </h3>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
    </div>
  );
}

/* ── Form Field ─────────────────────────────────────────────── */
function FormField({ icon, label, placeholder, value, onChange, type = "text", options = [], error }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
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
            className={`w-full pl-11 pr-10 py-3 rounded-xl border-2 text-sm bg-slate-50/50
              transition-all duration-200 outline-none appearance-none cursor-pointer
              ${error
                ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
                : "border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 hover:border-slate-300"
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
            className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 text-sm bg-slate-50/50
              transition-all duration-200 outline-none
              ${error
                ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
                : "border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 hover:border-slate-300"
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