// "use client";

// import { useState, useEffect, Suspense } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import axios from "axios";
// import { jwtDecode } from "jwt-decode";
// import ItemSection from "@/components/ItemSection";
// import CustomerSearch from "@/components/CustomerSearch";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// // ------------------ Constants --------------------
// const initialOrderState = {
//   customerCode: "",
//   customerName: "",
//   contactPerson: "",
//   refNumber: "",
//   salesEmployee: "",
//   status: "Open",
//   statusStages: "ETD Pending",
//   orderDate: "",
//   expectedDeliveryDate: "",
//   billingAddress: [],
//   shippingAddress: [],
//   items: [
//     {
//       item: "",
//       itemCode: "",
//       itemId: "",
//       itemName: "",
//       itemDescription: "",
//       quantity: "",
//       allowedQuantity: 0,
//       receivedQuantity: 0,
//       unitPrice: "",
//       discount: 0,
//       freight: 0,
//       taxOption: "GST",
//       priceAfterDiscount: 0,
//       totalAmount: 0,
//       gstAmount: 0,
//       gstRate: "",
//       cgstAmount: 0,
//       sgstAmount: 0,
//       igstAmount: 0,
//       managedBy: "",
//       batches: [],
//       errorMessage: "",
//       warehouse: "",
//       warehouseName: "",
//       warehouseCode: "",
//       warehouseId: "",
//       managedByBatch: true,
//     },
//   ],
//   remarks: "",
//   freight: 0,
//   rounding: 0,
//   totalDownPayment: 0,
//   appliedAmounts: 0,
//   totalBeforeDiscount: 0,
//   gstTotal: 0,
//   grandTotal: 0,
//   openBalance: 0,
//   fromQuote: false,
// };

// const round = (num, d = 2) => (isNaN(Number(num)) ? 0 : Number(Number(num).toFixed(d)));
// const formatDate = (d) => (!d ? "" : new Date(d).toISOString().slice(0, 10));

// const computeItemValues = (item) => {
//   const qty = parseFloat(item.quantity) || 0;
//   const price = parseFloat(item.unitPrice) || 0;
//   const disc = parseFloat(item.discount) || 0;
//   const fr = parseFloat(item.freight) || 0;
//   const pad = round(price - disc);
//   const total = round(qty * pad + fr);
//   if (item.taxOption === "GST") {
//     const gstRate = parseFloat(item.gstRate) || 0;
//     const cgst = round(total * (gstRate / 200));
//     return { priceAfterDiscount: pad, totalAmount: total, gstAmount: cgst * 2, cgstAmount: cgst, sgstAmount: cgst, igstAmount: 0 };
//   }
//   const igst = round(total * ((parseFloat(item.gstRate) || 0) / 100));
//   return { priceAfterDiscount: pad, totalAmount: total, gstAmount: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: igst };
// };

// // ------------------ Suspense wrapper -------------
// export default function SalesOrderPage() {
//   return (
//     <Suspense fallback={<div className="p-4">Loading…</div>}>
//       <SalesOrderForm />
//     </Suspense>
//   );
// }

// // ------------------ Main form --------------------
// function SalesOrderForm() {
//   const router = useRouter();
//   const params = useSearchParams();
//   const editId = params.get("editId");

//   // ---- Auth parsing ----
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [canEditStageOnly, setCanEditStageOnly] = useState(false);

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) return;
//     try {
//       const d = jwtDecode(token);
//       const roles = Array.isArray(d?.roles) ? d.roles : [];
//       const roleStr = d?.role ?? d?.userRole ?? null;
//       const isTrueCompany = d?.type === "company" && !!d?.companyName && roles.length === 0;
//       const loweredRoles = roles.map((r) => r.toLowerCase());
//       const isAdminRole = roleStr?.toLowerCase() === "admin" || loweredRoles.includes("admin");
//       const isSalesManager = loweredRoles.includes("sales manager");
//       setIsAdmin(isTrueCompany || isAdminRole);
//       setCanEditStageOnly(!isTrueCompany && !isAdminRole && isSalesManager);
//     } catch (e) {
//       console.error("JWT decode error", e);
//     }
//   }, []);

//   const isReadOnly = !!editId && !isAdmin;

//   // ---- State ----
//   const [formData, setFormData] = useState(initialOrderState);
//   const [loading, setLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [attachments, setAttachments] = useState([]); // New uploads
//   const [existingFiles, setExistingFiles] = useState([]); // From DB
//   const [removedFiles, setRemovedFiles] = useState([]); // For deletion
//   const [error, setError] = useState(null);
//   const [selectedCustomer, setSelectedCustomer] = useState(null);

//   // ---- Load when editing ----
//   useEffect(() => {
//     if (!editId || !/^[0-9a-fA-F]{24}$/.test(editId)) return;
//     setLoading(true);
//     axios
//       .get(`/api/sales-order/${editId}`)
//       .then(({ data }) => {
//         const r = data.data;
//         const items = (r.items ?? []).map((i) => ({
//           ...initialOrderState.items[0],
//           ...i,
//           item: i.item?._id || i.item || "",
//           warehouse: i.warehouse?._id || i.warehouse || "",
//           taxOption: i.taxOption || "GST",
//         }));
//         setExistingFiles(r.attachments || []);
//         setFormData({
//           ...initialOrderState,
//           ...r,
//           items: items.length ? items : initialOrderState.items,
//           orderDate: formatDate(r.orderDate),
//           expectedDeliveryDate: formatDate(r.expectedDeliveryDate),
//         });
//         if (r.customerCode || r.customerName) {
//           setSelectedCustomer({
//             _id: r.customer || r.customerCode,
//             customerCode: r.customerCode,
//             customerName: r.customerName,
//             contactPersonName: r.contactPerson,
//           });
//         }
//       })
//       .catch((e) => setError(e.message || "Failed to load"))
//       .finally(() => setLoading(false));
//   }, [editId]);

//   // ---- Totals calculation ----
//   useEffect(() => {
//     const items = formData.items || [];
//     const totalBefore = items.reduce((s, i) => s + (i.unitPrice * i.quantity - i.discount), 0);
//     const gstTotal = items.reduce((s, i) => s + i.gstAmount, 0);
//     const freight = parseFloat(formData.freight) || 0;
//     const unroundedTotal = totalBefore + gstTotal + freight;
//     const roundedTotal = Math.round(unroundedTotal);
//     const rounding = +(roundedTotal - unroundedTotal).toFixed(2);
//     const grandTotal = roundedTotal;
//     const openBalance = grandTotal - (formData.totalDownPayment + formData.appliedAmounts);
//     setFormData((p) => ({
//       ...p,
//       rounding,
//       totalBeforeDiscount: round(totalBefore),
//       gstTotal: round(gstTotal),
//       grandTotal: round(grandTotal),
//       openBalance: round(openBalance),
//     }));
//   }, [formData.items, formData.freight, formData.totalDownPayment, formData.appliedAmounts]);

//   // ---- Change handlers ----
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((p) => ({ ...p, [name]: value }));
//   };

//   const handleItemChange = (idx, e) => {
//     if (isReadOnly) return;
//     const { name, value } = e.target;
//     setFormData((p) => {
//       const items = [...p.items];
//       const numeric = ["quantity", "allowedQuantity", "receivedQuantity", "unitPrice", "discount", "freight", "gstRate"];
//       const val = numeric.includes(name) ? parseFloat(value) || 0 : value;
//       items[idx] = { ...items[idx], [name]: val, ...computeItemValues({ ...items[idx], [name]: val }) };
//       return { ...p, items };
//     });
//   };

//   const addItemRow = () => !isReadOnly && setFormData((p) => ({ ...p, items: [...p.items, { ...initialOrderState.items[0] }] }));

//   const removeItemRow = (idx) => !isReadOnly && setFormData((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

//   // ---- Submit ----
//   const handleSubmit = async () => {
//     if (!formData.customerCode || !formData.customerName) {
//       toast.error("Select a customer");
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) throw new Error("Not authenticated");
//       const headers = { Authorization: `Bearer ${token}` };

//       // Convert addresses if string
//       if (typeof formData.shippingAddress === "string") formData.shippingAddress = { address1: formData.shippingAddress };
//       if (typeof formData.billingAddress === "string") formData.billingAddress = { address1: formData.billingAddress };

//       if (editId) {
//         const fileChanges = attachments.length > 0 || removedFiles.length > 0;
//         if (fileChanges) {
//           const body = new FormData();
//           body.append("orderData", JSON.stringify(formData));
//           attachments.forEach((f) => body.append("newFiles", f));
//           body.append("removedFiles", JSON.stringify(removedFiles));
//           await axios.put(`/api/sales-order/${editId}`, body, { headers });
//         } else {
//           await axios.put(`/api/sales-order/${editId}`, formData, {
//             headers: { ...headers, "Content-Type": "application/json" },
//           });
//         }
//         toast.success("Updated successfully");
//       } else {
//         const body = new FormData();
//         body.append("orderData", JSON.stringify(formData));
//         attachments.forEach((f) => body.append("newFiles", f));
//         await axios.post("/api/sales-order", body, { headers });
//         toast.success("Created successfully");
//         setFormData(initialOrderState);
//         setAttachments([]);
//       }

//       router.push("/users/sales-order-view");
//     } catch (e) {
//       toast.error(e?.response?.data?.message || e.message);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (loading) return <div>Loading…</div>;
//   if (error) return <div className="text-red-600">{error}</div>;
//   const base = "w-full p-2 border rounded";
//   const ro = `${base} bg-gray-100`;

//   return (
//     <div className="m-8 p-5 border shadow-xl">
//       <h1 className="text-2xl font-bold mb-4">
//         {editId ? "Edit Sales Order" : "Create Sales Order"}
//       </h1>
//       {isReadOnly && (
//         <p className="text-sm text-gray-500 mb-2 italic">
//           Only Status and Sales Stage are editable for your role.
//         </p>
//       )}

//       {/* Customer Info */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//         <div>
//           <label className="font-medium block mb-1">Customer Name</label>
//           <input
//             name="customerName"
//             value={formData.customerName}
//             onChange={handleChange}
//             readOnly={isReadOnly}
//             className={isReadOnly ? ro : base}
//           />
//         </div>
//         <div>
//           <label className="font-medium">Customer Code</label>
//           <input
//             name="customerCode"
//             value={formData.customerCode}
//             onChange={handleChange}
//             readOnly={isReadOnly}
//             className={isReadOnly ? ro : base}
//           />
//         </div>
//       </div>

//       {/* Address Section */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//         <div>
//           <label className="font-medium block">Billing Address</label>
//           <textarea
//             name="billingAddress"
//             value={
//               typeof formData.billingAddress === "object"
//                 ? formData.billingAddress.address1 || ""
//                 : formData.billingAddress || ""
//             }
//             onChange={handleChange}
//             rows={3}
//             readOnly={isReadOnly}
//             className={isReadOnly ? ro : base}
//           />
//         </div>
//         <div>
//           <label className="font-medium block">Shipping Address</label>
//           <textarea
//             name="shippingAddress"
//             value={
//               typeof formData.shippingAddress === "object"
//                 ? formData.shippingAddress.address1 || ""
//                 : formData.shippingAddress || ""
//             }
//             onChange={handleChange}
//             rows={3}
//             readOnly={isReadOnly}
//             className={isReadOnly ? ro : base}
//           />
//         </div>
//       </div>

//       {/* Status Section */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//         <div>
//           <label className="font-medium">Order Date</label>
//           <input type="date" value={formData.orderDate} readOnly className={ro} />
//         </div>
//         <div>
//           <label className="font-medium">Expected Delivery</label>
//           <input
//             type="date"
//             name="expectedDeliveryDate"
//             value={formData.expectedDeliveryDate}
//             onChange={handleChange}
//             className={base}
//             disabled={isReadOnly && !canEditStageOnly}
//           />
//         </div>
//         <div>
//           <label className="font-medium">Status</label>
//           <select
//             name="status"
//             value={formData.status}
//             onChange={handleChange}
//             className={base}
//             disabled={isReadOnly && !isAdmin}
//           >
//             <option>Open</option>
//             <option>Pending</option>
//             <option>Closed</option>
//             <option>Cancelled</option>
//           </select>
//         </div>
//         <div>
//           <label className="font-medium">Sales Stage</label>
//           <select
//             name="statusStages"
//             value={formData.statusStages}
//             onChange={handleChange}
//             className={base}
//             disabled={isReadOnly && !canEditStageOnly}
//           >
//             <option>ETD Pending</option>
//             <option>ETD Confirmation from plant</option>
//             <option>ETD notification for SC-cremika</option>
//             <option>SC to concerned sales & customer</option>
//             <option>Material in QC-OK/NOK</option>
//             <option>Dispatch with qty</option>
//             <option>Delivered to customer</option>
//           </select>
//         </div>
//       </div>

//       {/* Items */}
//       <ItemSection
//         items={formData.items}
//         onItemChange={handleItemChange}
//         onAddItem={addItemRow}
//         onRemoveItem={removeItemRow}
//         computeItemValues={computeItemValues}
//         disabled={isReadOnly}
//       />

//       {/* Totals */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
//         {[
//           ["Total Before Discount", "totalBeforeDiscount", true],
//           ["GST Total", "gstTotal", true],
//           ["Freight", "freight", false],
//           ["Rounding", "rounding", true],
//           ["Grand Total", "grandTotal", true],
//         ].map(([label, key, readOnly]) => (
//           <div key={key}>
//             <label>{label}</label>
//             <input
//               name={key}
//               value={formData[key]}
//               onChange={handleChange}
//               readOnly={readOnly || isReadOnly}
//               className={readOnly || isReadOnly ? ro : base}
//             />
//           </div>
//         ))}
//       </div>

//       {/* Remarks */}
//       <div className="mt-6">
//         <label className="font-medium">Remarks</label>
//         <textarea
//           name="remarks"
//           value={formData.remarks}
//           onChange={handleChange}
//           readOnly={isReadOnly}
//           rows={3}
//           className={isReadOnly ? ro : base}
//         />
//       </div>

//   {/* Attachments Section */}
// <div className="mt-6">
//   <label className="font-medium block mb-1">Attachments</label>

//   {/* Existing Files */}
//   {existingFiles.length > 0 && (
//     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
//       {existingFiles.map((file, idx) => {
//         const url = file?.fileUrl || file?.url || "";
//         const isPDF = url.toLowerCase().endsWith(".pdf");
//         return (
//           <div key={idx} className="relative border rounded p-2 text-center">
//             {isPDF ? (
//               <object data={url} type="application/pdf" className="h-24 w-full rounded" />
//             ) : (
//               <img src={url} className="h-24 w-full object-cover rounded" />
//             )}
//             {(isAdmin || canEditStageOnly || true) && (
//               <button
//                 onClick={() => {
//                   setRemovedFiles((prev) => [...prev, file]);
//                   setExistingFiles((prev) => prev.filter((_, i) => i !== idx));
//                 }}
//                 className="absolute top-1 right-1 bg-red-600 text-white rounded px-1 text-xs"
//               >
//                 ×
//               </button>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   )}

//   {/* File Input for New Uploads */}
//   {(isAdmin || canEditStageOnly || true) && (
//     <>
//       <input
//         type="file"
//         multiple
//         accept="image/*,application/pdf"
//         onChange={(e) => {
//           const files = Array.from(e.target.files);
//           setAttachments((prev) => [...prev, ...files]);
//           e.target.value = "";
//         }}
//         className={base}
//       />

//       {/* Previews of new uploads */}
//       {attachments.length > 0 && (
//         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-3">
//           {attachments.map((file, idx) => {
//             const url = URL.createObjectURL(file);
//             const isPDF = file.type === "application/pdf";
//             return (
//               <div key={idx} className="relative border rounded p-2 text-center">
//                 {isPDF ? (
//                   <object data={url} type="application/pdf" className="h-24 w-full rounded" />
//                 ) : (
//                   <img src={url} alt={file.name} className="h-24 w-full object-cover rounded" />
//                 )}
//                 <button
//                   onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
//                   className="absolute top-1 right-1 bg-red-600 text-white rounded px-1 text-xs"
//                 >
//                   ×
//                 </button>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </>
//   )}
// </div>

//     {(isAdmin || canEditStageOnly || attachments.length > 0 || removedFiles.length > 0) && (
//   <button
//     onClick={handleSubmit}
//     disabled={submitting}
//     className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//   >
//     {submitting ? "Saving..." : editId ? "Update Order" : "Create Order"}
//   </button>
// )}

//     </div>
//   );
// }




"use client";

// --------------------------------------------------
//  SalesOrderPage — full React client component (Next‑13/14)
//  • Company login (token.type === "company" && companyName) OR roles.includes("admin")
//    ⇒ full edit rights
//  • Other users ⇒ when editing (editId present) only Status + Sales Stage may change
// --------------------------------------------------

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // ✅ correct


import ItemSection from "@/components/ItemSection";
import CustomerSearch from "@/components/CustomerSearch";
import CustomerAddressSelector from "@/components/CustomerAddressSelector";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ------------------ Constants --------------------
const initialOrderState = {
  customerCode: "",
  customerName: "",
  contactPerson: "",
  refNumber: "",
  salesEmployee: "",
  status: "Open",
  statusStages: "ETD Pending",
  orderDate: "",
  expectedDeliveryDate: "",
  billingAddress: [],
  shippingAddress: [],
  items: [
    {
      item: "",
      itemCode: "",
      itemId: "",
      itemName: "",
      itemDescription: "",
      quantity: "",
      allowedQuantity: 0,
      receivedQuantity: 0,
      unitPrice: "",
      discount: 0,
      freight: 0,
      taxOption: "GST",
      priceAfterDiscount: 0,
      totalAmount: 0,
      gstAmount: 0,
      gstRate: "",
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      managedBy: "",
      batches: [],
      errorMessage: "",
      warehouse: "",
      warehouseName: "",
      warehouseCode: "",
      warehouseId: "",
      managedByBatch: true,
    },
  ],
  remarks: "",
  freight: 0,
  rounding: 0,
  totalDownPayment: 0,
  appliedAmounts: 0,
  totalBeforeDiscount: 0,
  gstTotal: 0,
  grandTotal: 0,
  openBalance: 0,
  fromQuote: false,
};

const round = (num, d = 2) => (isNaN(Number(num)) ? 0 : Number(Number(num).toFixed(d)));
const formatDate = (d) => (!d ? "" : new Date(d).toISOString().slice(0, 10));

const computeItemValues = (item) => {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const disc = parseFloat(item.discount) || 0;
  const fr = parseFloat(item.freight) || 0;
  const pad = round(price - disc);
  const total = round(qty * pad + fr);
  if (item.taxOption === "GST") {
    const gstRate = parseFloat(item.gstRate) || 0;
    const cgst = round(total * (gstRate / 200));
    return { priceAfterDiscount: pad, totalAmount: total, gstAmount: cgst * 2, cgstAmount: cgst, sgstAmount: cgst, igstAmount: 0 };
  }
  const igst = round(total * ((parseFloat(item.gstRate) || 0) / 100));
  return { priceAfterDiscount: pad, totalAmount: total, gstAmount: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: igst };
};

// ------------------ Suspense wrapper -------------
export default function SalesOrderPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <SalesOrderForm />
    </Suspense>
  );
}

// ------------------ Main form --------------------
function SalesOrderForm() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("editId");

  // ---- Auth parsing ----
  const [isAdmin, setIsAdmin] = useState(false);
  // useEffect(() => {
  //   const token = localStorage.getItem("token");
  //   if (!token) return;
  //   try {
  //     const d = jwt_decode(token);
  //     const roles = Array.isArray(d?.roles) ? d.roles : [];
  //     const roleStr = d?.role ?? d?.userRole ?? null;
  //     const isCompany = d?.type === "company" && d?.companyName;
  //     setIsAdmin(roleStr === "admin" || roles.includes("admin") || isCompany);
  //   } catch (e) {
  //     console.error("JWT decode error", e);
  //   }
  // }, []);

  //  
  
  const [canEditStageOnly, setCanEditStageOnly] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const d = jwtDecode(token);
      const roles = Array.isArray(d?.roles) ? d.roles : [];
      const roleStr = d?.role ?? d?.userRole ?? null;
      const isTrueCompany = d?.type === "company" && !!d?.companyName && roles.length === 0;
      const loweredRoles = roles.map((r) => r.toLowerCase());
      const isAdminRole = roleStr?.toLowerCase() === "admin" || loweredRoles.includes("admin");
      const isSalesManager = loweredRoles.includes("sales manager");
      setIsAdmin(isTrueCompany || isAdminRole);
      setCanEditStageOnly(!isTrueCompany && !isAdminRole && isSalesManager);
    } catch (e) {
      console.error("JWT decode error", e);
    }
  }, []);

   const isReadOnly = !!editId && !isAdmin;
  // ---- State ----
  const [formData, setFormData] = useState(initialOrderState);
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customBilling, setCustomBilling] = useState(false);
  const [customShipping, setCustomShipping] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [existingFiles, setExistingFiles] = useState([]);
  const [removedFiles, setRemovedFiles] = useState([]);

  // ---- Prefill when copying ----
  useEffect(() => {
    const cached = sessionStorage.getItem("salesOrderData");
    if (!cached) return;
    try { setFormData(JSON.parse(cached)); setIsCopied(true); } catch {}
    sessionStorage.removeItem("salesOrderData");
  }, []);

  // ---- Load when editing ----
  useEffect(() => {
    if (!editId || !/^[0-9a-fA-F]{24}$/.test(editId)) return;
    setLoading(true);
    axios.get(`/api/sales-order/${editId}`)
      .then(({ data }) => {
        const r = data.data;
        const items = (r.items ?? []).map((i) => ({
          ...initialOrderState.items[0],
          ...i,

          item: i.item?._id || i.item || "",
          warehouse: i.warehouse?._id || i.warehouse || "",
          taxOption: i.taxOption || "GST",
        }));
        setExistingFiles(r.attachments || []);
        setFormData({ ...initialOrderState, ...r, items: items.length ? items : initialOrderState.items, orderDate: formatDate(r.orderDate), expectedDeliveryDate: formatDate(r.expectedDeliveryDate) });
        if (r.customerCode || r.customerName) {
          setSelectedCustomer({ _id: r.customer || r.customerCode, customerCode: r.customerCode, customerName: r.customerName, contactPersonName: r.contactPerson });
        }
      })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [editId]);

  // ---- Totals calculation ----
  useEffect(() => {
    const items = formData.items || [];
    const totalBefore = items.reduce((s, i) => s + (i.unitPrice * i.quantity - i.discount), 0);
    const gstTotal = items.reduce((s, i) => s + i.gstAmount, 0);
    // const grandTotal = totalBefore + gstTotal + formData.freight + formData.rounding;

   const freight = parseFloat(formData.freight) || 0;
const unroundedTotal = totalBefore + gstTotal + freight;
const roundedTotal = Math.round(unroundedTotal);
const rounding = +(roundedTotal - unroundedTotal).toFixed(2);
const grandTotal = roundedTotal;
formData.rounding = rounding;


    const openBalance = grandTotal - (formData.totalDownPayment + formData.appliedAmounts);
    setFormData((p) => ({ ...p, totalBeforeDiscount: round(totalBefore), gstTotal: round(gstTotal), grandTotal: round(grandTotal), openBalance: round(openBalance) }));
  }, [formData.items, formData.freight, formData.rounding, formData.totalDownPayment, formData.appliedAmounts]);

  // ---- Change helpers ----
  const onCustomer = (c) => {
    setSelectedCustomer(c);
    setFormData((p) => ({ ...p, customer: c._id, customerName: c.customerName, customerCode: c.customerCode, contactPerson: c.contactPersonName, billingAddress: null, shippingAddress: null }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleItemChange = (idx, e) => {
    if (isReadOnly) return;
    const { name, value } = e.target;
    setFormData((p) => {
      const items = [...p.items];
      const numeric = ["quantity", "allowedQuantity", "receivedQuantity", "unitPrice", "discount", "freight", "gstRate"];
      const val = numeric.includes(name) ? parseFloat(value) || 0 : value;
      items[idx] = { ...items[idx], [name]: val, ...computeItemValues({ ...items[idx], [name]: val }) };
      return { ...p, items };
    });
  };

  const addItemRow = () => !isReadOnly && setFormData((p) => ({ ...p, items: [...p.items, { ...initialOrderState.items[0] }] }));
  const removeItemRow = (idx) => !isReadOnly && setFormData((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  // ---- Submit ----
  // const handleSubmit = async () => {
  //   if (!formData.customerCode || !formData.customerName) { toast.error("Select a customer"); return; }
  //   setSubmitting(true);
  //   try {
  //     const token = localStorage.getItem("token");
  //     if (!token) throw new Error("Not authenticated");
  //     const headers = { Authorization: `Bearer ${token}` };
    //       // 🟡 Convert plain string to object if needed
    // if (typeof formData.shippingAddress === "string") {
    //   formData.shippingAddress = { address1: formData.shippingAddress };
    // }
    // if (typeof formData.billingAddress === "string") {
    //   formData.billingAddress = { address1: formData.billingAddress };
    // }
  //     if (editId) {
  //       const payload = isAdmin ? formData : { status: formData.status, statusStages: formData.statusStages };
  //       await axios.put(`/api/sales-order/${editId}`, payload, { headers });
  //       toast.success("Updated successfully");
  //     } else {
  //       const body = new FormData();
  //       body.append("orderData", JSON.stringify(formData));
  //       attachments.forEach((f) => body.append("attachments", f));
  //       formData.append("existingFiles", JSON.stringify(existingFiles));
  //       formData.append("removedFiles", JSON.stringify(removedFiles));
  //       await axios.post("/api/sales-order", body, { headers });
  //       toast.success("Created successfully");
  //       setFormData(initialOrderState);
  //       setAttachments([]);
  //     }
  //     router.push("/admin/sales-order-view");
  //   } catch (e) {
  //     toast.error(e?.response?.data?.message || e.message);
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };


  const handleSubmit = async () => {
  if (!formData.customerCode || !formData.customerName) {
    toast.error("Select a customer");
    return;
  }

  setSubmitting(true);
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated");
    const headers = { Authorization: `Bearer ${token}` };

          // 🟡 Convert plain string to object if needed
    if (typeof formData.shippingAddress === "string") {
      formData.shippingAddress = { address1: formData.shippingAddress };
    }
    if (typeof formData.billingAddress === "string") {
      formData.billingAddress = { address1: formData.billingAddress };
    }

    /* ───────── EDIT ───────── */
    if (editId) {
      if (!isAdmin && canEditStageOnly) {
        // limited role → only stage fields
        await axios.put(
          `/api/sales-order/${editId}`,
          { status: formData.status, statusStages: formData.statusStages },
          { headers }
        );
        toast.success("Stage updated");
      } else {
        const fileChanges = attachments.length > 0 || removedFiles.length > 0;
        if (fileChanges) {
          const body = new FormData();
          body.append("orderData", JSON.stringify(formData));
          attachments.forEach((f) => body.append("newFiles", f));
          body.append("removedFiles", JSON.stringify(removedFiles));
          await axios.put(`/api/sales-order/${editId}`, body, { headers });
        } else {
          await axios.put(
            `/api/sales-order/${editId}`,
            formData,
            { headers: { ...headers, "Content-Type": "application/json" } }
          );
        }
        toast.success("Updated successfully");
      }

    /* ───────── CREATE ───────── */
    } else {
      const body = new FormData();
      body.append("orderData", JSON.stringify(formData));
      attachments.forEach((f) => body.append("newFiles", f));
      await axios.post("/api/sales-order", body, { headers });
      toast.success("Created successfully");
      setFormData(initialOrderState);
      setAttachments([]);
    }

    router.push("/users/sales-order-view");
  } catch (e) {
    toast.error(e?.response?.data?.message || e.message);
  } finally {
    setSubmitting(false);
  }
};


  // ---- Auto‑set today for new order ----
  useEffect(() => { if (!editId) setFormData((p) => ({ ...p, orderDate: new Date().toISOString().slice(0, 10) })); }, [editId]);

  // ---- Render helpers ----
  if (loading) return <div>Loading…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  const base = "w-full p-2 border rounded";
  const ro = `${base} bg-gray-100`;

  return (
    <div className="m-8 p-5 border shadow-xl">
      <h1 className="text-2xl font-bold mb-4">{editId ? "Edit Sales Order" : "Create Sales Order"}</h1>
      {isReadOnly && <p className="text-sm text-gray-500 mb-2 italic">Only Status and Sales Stage are editable for your role.</p>}

      {/* ---------- Customer / Meta ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Customer Name */}
        <div>
          <label className="font-medium block mb-1">Customer Name</label>
          {isReadOnly || isCopied ? (
            <input value={formData.customerName} readOnly className={ro} />
          ) : isNewCustomer ? (
            <>
              <input name="customerName" value={formData.customerName} onChange={handleChange} className={base} placeholder="Enter new customer" />
              <button type="button" onClick={() => setIsNewCustomer(false)} className="mt-1 bg-gray-200 px-3 py-1 rounded text-sm">⬅︎ Back to search</button>
            </>
          ) : (
            <>
              <CustomerSearch onSelectCustomer={onCustomer} onNotFound={(text) => { setIsNewCustomer(true); setFormData((p) => ({ ...p, customerName: text })); }} />
              <button type="button" onClick={() => setIsNewCustomer(true)} className="mt-1 bg-gray-200 px-3 py-1 rounded text-sm">+ Add new customer</button>
            </>
          )}
        </div>
        {/* Customer Code */}
        <div>
          <label className="font-medium">Customer Code</label>
          <input name="customerCode" value={formData.customerCode} onChange={handleChange} readOnly={isReadOnly} className={isReadOnly ? ro : base} />
        </div>
        {/* Contact Person */}
        <div>
          <label className="font-medium">Contact Person</label>
          <input name="contactPerson" value={formData.contactPerson} onChange={handleChange} readOnly={isReadOnly} className={isReadOnly ? ro : base} />
        </div>
        {/* Ref Number */}
        <div>
          <label className="font-medium">Reference No.</label>
          <input name="refNumber" value={formData.refNumber} onChange={handleChange} readOnly={isReadOnly} className={isReadOnly ? ro : base} />
        </div>
      </div>

      {/* ---------- Address Section ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Billing */}
        <div>
          <label className="font-medium block">Billing Address</label>
          {customBilling && !isReadOnly ? (
            <>
              <textarea name="billingAddress" value={formData.billingAddress || ""} onChange={handleChange} rows={3} readOnly={isReadOnly} className={isReadOnly ? ro : base} />
              <button className="text-blue-600 text-sm" onClick={() => { setCustomBilling(false); setFormData((p) => ({ ...p, billingAddress: null })); }}>⬅︎ Select saved</button>
            </>
          ) : (
            <>
              {/* <CustomerAddressSelector disabled={isReadOnly} customer={selectedCustomer} selectedBillingAddress={formData.billingAddress} selectedShippingAddress={formData.shippingAddress} onBillingAddressSelect={(addr) => setFormData((p) => ({ ...p, billingAddress: addr }))} onShippingAddressSelect={(addr) => setFormData((p) => ({ ...p, shippingAddress: addr }))} /> */}
               <textarea name="billingAddress" value={formData.billingAddress.address1 || ""} onChange={handleChange} rows={3}  readOnly={isReadOnly}  className={isReadOnly ? ro : base} />
              {!isReadOnly && <button className="text-blue-600 text-sm" onClick={() => { setCustomBilling(true); setFormData((p) => ({ ...p, billingAddress: "" })); }}>+ Enter billing address</button>}
            </>
          )}
        </div>
        {/* Shipping */}
        <div>
          <label className="font-medium block">Shipping Address</label>
          {customShipping && !isReadOnly ? (
            <>
              <textarea name="shippingAddress" value={formData.shippingAddress || ""} onChange={handleChange} rows={3} readOnly={isReadOnly} className={isReadOnly ? ro : base} />
              <button className="text-blue-600 text-sm" onClick={() => { setCustomShipping(false); setFormData((p) => ({ ...p, shippingAddress: null })); }}>⬅︎ Select saved</button>
            </>
          ) : (
            <>
              {/* <CustomerAddressSelector disabled={isReadOnly} customer={selectedCustomer} selectedBillingAddress={formData.billingAddress} selectedShippingAddress={formData.shippingAddress} onBillingAddressSelect={(addr) => setFormData((p) => ({ ...p, billingAddress: addr }))} onShippingAddressSelect={(addr) => setFormData((p) => ({ ...p, shippingAddress: addr }))} /> */}
                 <textarea name="shippingAddress" value={formData.shippingAddress.address1 || ""} onChange={handleChange} rows={3} readOnly={isReadOnly} className={isReadOnly ? ro : base} />
              {!isReadOnly && <button className="text-blue-600 text-sm" onClick={() => { setCustomShipping(true); setFormData((p) => ({ ...p, shippingAddress: "" })); }}>+ Enter shipping address</button>}
            </>
          )}
        </div>
      </div>

      {/* ---------- Dates & Status ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="font-medium">Order Date</label>
          <input type="date" value={formData.orderDate} readOnly className={ro} />
        </div>
        <div>
          <label className="font-medium">Expected Delivery</label>
          <input type="date" name="expectedDeliveryDate" value={formData.expectedDeliveryDate} onChange={handleChange} className={base}  disabled={isReadOnly && !canEditStageOnly }/>
        </div>
        <div>
          <label className="font-medium">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className={base} disabled={isReadOnly && !isAdmin}>
            <option>Open</option><option>Pending</option><option>Closed</option><option>Cancelled</option>
          </select>
        </div>
        <div>
          <label className="font-medium">Sales Stage</label>
          <select name="statusStages" value={formData.statusStages} onChange={handleChange} className={base}  disabled={isReadOnly && !canEditStageOnly }>
           <option>ETD Pending</option> <option>ETD Confirmation from plant</option><option>ETD notification for SC-cremika</option><option>SC to concerned sales & customer</option><option>Material in QC-OK/NOK</option><option>Dispatch with qty</option><option>Delivered to customer</option>
          </select>
        </div>
      </div>

      {/* ---------- Items ---------- */}
      <ItemSection items={formData.items} onItemChange={handleItemChange} onAddItem={addItemRow} onRemoveItem={removeItemRow} computeItemValues={computeItemValues} disabled={isReadOnly} />

      {/* ---------- Totals ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {[
          ["Total Before Discount", "totalBeforeDiscount", true],
          ["GST Total", "gstTotal", true],
          ["Freight", "freight", false],
          ["Rounding", "rounding", false],
          ["Grand Total", "grandTotal", true],
          // ["Open Balance", "openBalance", true],
        ].map(([label, key, readOnly]) => (
          <div key={key}>
            <label>{label}</label>
            <input name={key} value={formData[key]} onChange={handleChange} readOnly={readOnly || isReadOnly} className={readOnly || isReadOnly ? ro : base} />
          </div>
        ))}
      </div>

      {/* ---------- Remarks ---------- */}
      <div className="mt-6">
        <label className="font-medium">Remarks</label>
        <textarea name="remarks" value={formData.remarks} onChange={handleChange} readOnly={isReadOnly} rows={3} className={isReadOnly ? ro : base} />
      </div>





  {/* Attachments Section */}
<div className="mt-6">
  <label className="font-medium block mb-1">Attachments</label>

  {/* Existing Files */}
  {existingFiles.length > 0 && (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
      {existingFiles.map((file, idx) => {
        const url = file?.fileUrl || file?.url || "";
        const isPDF = url.toLowerCase().endsWith(".pdf");
        return (
          <div key={idx} className="relative border rounded p-2 text-center">
            {isPDF ? (
              <object data={url} type="application/pdf" className="h-24 w-full rounded" />
            ) : (
              <img src={url} className="h-24 w-full object-cover rounded" />
            )}
            {(isAdmin || canEditStageOnly || true) && (
              <button
                onClick={() => {
                  setRemovedFiles((prev) => [...prev, file]);
                  setExistingFiles((prev) => prev.filter((_, i) => i !== idx));
                }}
                className="absolute top-1 right-1 bg-red-600 text-white rounded px-1 text-xs"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  )}

  {/* File Input for New Uploads */}
  {(isAdmin || canEditStageOnly || true) && (
    <>
      <input
        type="file"
        multiple
        accept="image/*,application/pdf"
        onChange={(e) => {
          const files = Array.from(e.target.files);
          setAttachments((prev) => [...prev, ...files]);
          e.target.value = "";
        }}
        className={base}
      />

      {/* Previews of new uploads */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-3">
          {attachments.map((file, idx) => {
            const url = URL.createObjectURL(file);
            const isPDF = file.type === "application/pdf";
            return (
              <div key={idx} className="relative border rounded p-2 text-center">
                {isPDF ? (
                  <object data={url} type="application/pdf" className="h-24 w-full rounded" />
                ) : (
                  <img src={url} alt={file.name} className="h-24 w-full object-cover rounded" />
                )}
                <button
                  onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded px-1 text-xs"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  )}
</div>

    {(isAdmin || canEditStageOnly || attachments.length > 0 || removedFiles.length > 0) && (
  <button
    onClick={handleSubmit}
    disabled={submitting}
    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  >
    {submitting ? "Saving..." : editId ? "Update Order" : "Create Order"}
  </button>
)}

    </div>
  );
}



