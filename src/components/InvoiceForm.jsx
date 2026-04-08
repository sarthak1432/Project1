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
  Download,
  Phone,
  Loader2,
  Zap,
  Plus,
  Trash2,
  Paperclip,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import generatePDF from "../utils/generatePDF";
import { Toast, SectionLabel, FormField } from "./FormElements";

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
  designDevCost: "",
  paymentMode: "Cash",
  paymentStatus: "Paid",
  addGST: "No",
  customerGST: "",
};

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
    const devCost = Number(formData.designDevCost) || 0;
    const subtotal = gramCost + extra + devCost;
    const gst = formData.addGST === "Yes" ? subtotal * 0.18 : 0;
    return subtotal + gst;
  }, [formData.grams, formData.ratePerGram, formData.extraCost, formData.designDevCost, formData.addGST]);

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
    if (!validate()) {
      showToast("Please fix errors in the form.", "error");
      return;
    }

    setLoading(true);
    let stage = "Initializing";
    console.log("Submit started...");

    try {
      stage = "Getting Invoice Number";
      let invoiceNumber = 1;

      // ATOMIC TRANSACTION TO GET SEQUENTIAL INVOICE NUMBER
      console.log("Fetching invoice number...");
      try {
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
      } catch (transErr) {
        console.error("Transaction failed:", transErr);
        throw new Error(`Invoice number counter failed: ${transErr.message}. Make sure Firebase rules allow access to 'metadata/counters'.`);
      }
      
      console.log("Invoice number assigned:", invoiceNumber);

      stage = "Saving Document";
      const subtotal = (Number(formData.grams) * Number(formData.ratePerGram)) + Number(formData.extraCost || 0) + Number(formData.designDevCost || 0);
      const gstAmount = formData.addGST === "Yes" ? subtotal * 0.18 : 0;
      const totalAmount = subtotal + gstAmount;

      const payload = {
        customer: formData.customer || "Unknown",
        designTime: formData.designTime || "0",
        printTime: formData.printTime || "0",
        model: formData.model || "Unknown",
        filament: formData.filament || "PLA",
        grams: Number(formData.grams) || 0,
        price: Number(formData.ratePerGram) || 0,
        clientPhone: formData.clientPhone || "",
        developmentTime: Number(formData.developmentTime) || 0,
        accessories: Array.isArray(formData.accessories) ? formData.accessories.filter(a => a && a.trim()) : [],
        extraCost: Number(formData.extraCost) || 0,
        designDevCost: Number(formData.designDevCost) || 0,
        paymentMode: formData.paymentMode || "Cash",
        paymentStatus: formData.paymentStatus || "Paid",
        addGST: formData.addGST || "No",
        customerGST: formData.customerGST || "",
        invoiceNumber,
        gstAmount,
        subtotal,
        total: totalAmount,
        date: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString()
      };

      /* SAVE FIRESTORE */
      console.log("Saving to Firestore...");
      try {
        await addDoc(collection(db, "invoices"), payload);
      } catch (dbErr) {
        console.error("Firestore addDoc failed:", dbErr);
        throw new Error(`Database save failed: ${dbErr.message}. Check your Firebase permissions/rules.`);
      }
      console.log("Saved to Firestore.");

      /* PDF */
      stage = "Generating PDF";
      console.log("Generating PDF...");
      let blob;
      try {
        blob = await generatePDF(payload);
      } catch (pdfErr) {
        console.error("PDF generation failed:", pdfErr);
        throw new Error(`PDF creation failed: ${pdfErr.message}`);
      }
      
      if (!blob || blob.size === 0) {
        throw new Error("Generated PDF blob is empty or invalid.");
      }

      console.log("PDF Blob created, size:", blob.size);
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = buildFilename();
      document.body.appendChild(a);
      
      console.log("Triggering download...");
      a.click();
      
      // Cleanup
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      }, 100);

      resetForm();
      setErrors({});
      showToast("Invoice saved & PDF downloaded successfully!");
      console.log("Finalized successfully.");
    } catch (err) {
      console.error(`Error at ${stage}:`, err);
      showToast(`${stage} Failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
        className="w-full transition-colors"
      >
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white/50 dark:border-slate-800/50 overflow-hidden">

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

          <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6 sm:space-y-7">
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
                <FormField
                 icon={<Droplets size={18} />}
                 label="Filament Type"
                 type="select"
                 placeholder="Select filament..."
                 value={formData.filament}
                 options={FILAMENT_OPTIONS}
                 onChange={(v) => updateField("filament", v)}
                 error={errors.filament}
                />
              </div>
            </section>

            <section>
              <SectionLabel text="Time Estimates" />
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                <FormField
                  icon={<Clock size={18} />}
                  label="Design Time"
                  placeholder="Hours"
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
                  icon={<IndianRupee size={18} />}
                  label="Design & Development Cost (₹)"
                  placeholder="Enter design & development cost"
                  type="number"
                  value={formData.designDevCost}
                  onChange={(v) => updateField("designDevCost", v)}
                />
              </div>

              <div className="mt-4 sm:mt-5">
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

            <section>
              <div className="flex items-center justify-between mb-4">
                <SectionLabel text="Additional Accessories" />
                <button
                  type="button"
                  onClick={addAccessory}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors"
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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-sm bg-slate-50/30 dark:bg-slate-800/30 dark:text-slate-200 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-all placeholder:dark:text-slate-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAccessory(idx)}
                      className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
                {formData.accessories.length === 0 && (
                  <p className="text-center py-4 text-slate-400 dark:text-slate-500 text-xs italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                    No accessories added. Click "Add Item" to include extra parts.
                  </p>
                )}
              </div>
            </section>

            <section>
              <SectionLabel text="Add-ons & Payment" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
                <FormField
                  icon={<IndianRupee size={18} />}
                  label="Extra Cost (INR)"
                  placeholder="₹ Manual additional cost"
                  type="number"
                  value={formData.extraCost}
                  onChange={(v) => updateField("extraCost", v)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-5">
                <FormField
                  icon={<FileText size={18} />}
                  label="Payment Status"
                  type="select"
                  value={formData.paymentStatus}
                  options={["Pending", "Paid"]}
                  onChange={(v) => updateField("paymentStatus", v)}
                />
                {formData.paymentStatus === "Paid" && (
                  <FormField
                    icon={<CreditCard size={18} />}
                    label="Payment Mode"
                    type="select"
                    value={formData.paymentMode}
                    options={["Cash", "UPI"]}
                    onChange={(v) => updateField("paymentMode", v)}
                  />
                )}
              </div>
            </section>

            <motion.div
              layout
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 p-5 sm:p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Final Amount</p>
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