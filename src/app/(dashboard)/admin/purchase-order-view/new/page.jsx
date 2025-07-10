"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import ItemSection from "@/components/ItemSection";
import SupplierSearch from "@/components/SupplierSearch";
import { Suspense } from "react";

const round = (num, decimals = 2) => {
  const n = Number(num);
  if (isNaN(n)) return 0;
  return Number(n.toFixed(decimals));
};

const computeItemValues = (item) => {
  const quantity = parseFloat(item.quantity) || 0;
  const unitPrice = parseFloat(item.unitPrice) || 0;
  const discount = parseFloat(item.discount) || 0;
  const freight = parseFloat(item.freight) || 0;
  const priceAfterDiscount = round(unitPrice - discount);
  const totalAmount = round(quantity * priceAfterDiscount + freight);

  if (item.taxOption === "GST") {
    const gstRate = parseFloat(item.gstRate) || 0;
    const cgstRate = item.cgstRate !== undefined ? parseFloat(item.cgstRate) : gstRate / 2;
    const sgstRate = item.sgstRate !== undefined ? parseFloat(item.sgstRate) : gstRate / 2;
    const cgstAmount = round(totalAmount * (cgstRate / 100));
    const sgstAmount = round(totalAmount * (sgstRate / 100));
    const gstAmount = round(cgstAmount + sgstAmount);
    return {
      priceAfterDiscount,
      totalAmount,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount: 0,
    };
  }

  if (item.taxOption === "IGST") {
    let igstRate = item.igstRate;
    if (igstRate === undefined || parseFloat(igstRate) === 0) {
      igstRate = item.gstRate !== undefined ? parseFloat(item.gstRate) : 0;
    } else {
      igstRate = parseFloat(igstRate);
    }
    const igstAmount = round(totalAmount * (igstRate / 100));
    return {
      priceAfterDiscount,
      totalAmount,
      gstAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount,
    };
  }

  return {
    priceAfterDiscount,
    totalAmount,
    gstAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
  };
};

const initialState = {
  sourceQuotationId: "",
  supplier: "",
  supplierCode: "",
  supplierName: "",
  contactPerson: "",
  refNumber: "",
  orderStatus: "Open",
  paymentStatus: "Pending",
  stockStatus: "Not Updated",
  postingDate: "",
  validUntil: "",
  documentDate: "",
  items: [
    {
      item: "",
      itemCode: "",
      itemName: "",
      itemDescription: "",
      orderedQuantity: 0,
      receivedQuantity: 0,
      quantity: 0,
      unitPrice: 0,
      discount: 0,
      freight: 0,
      gstRate: 0,
      taxOption: "GST",
      priceAfterDiscount: 0,
      totalAmount: 0,
      gstAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      tdsAmount: 0,
      managedBy: "",
      batches: [],
      qualityCheckDetails: [],
      warehouse: "",
      warehouseCode: "",
      warehouseName: "",
      stockAdded: false,
    },
  ],
  salesEmployee: "",
  remarks: "",
  freight: 0,
  rounding: 0,
  totalBeforeDiscount: 0,
  totalDownPayment: 0,
  appliedAmounts: 0,
  gstTotal: 0,
  grandTotal: 0,
  openBalance: 0,
};

function formatDateForInput(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = ("0" + (d.getMonth() + 1)).slice(-2);
  const day = ("0" + d.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
}

function OrderFormWrapper() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading form data...</div>}>
      <OrderForm />
    </Suspense>
  );
}

function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pqStatusUpdated, setPqStatusUpdated] = useState(false);
  const [originalPQItems, setOriginalPQItems] = useState([]);

  // useEffect(() => {
  //   const loadFormData = async () => {
  //     // Initialize from sessionStorage if no editId
  //     if (!editId) {
  //       const storedData = sessionStorage.getItem("purchaseOrderData");
  //       if (storedData) {
  //         try {
  //           const quotation = JSON.parse(storedData);
            
  //           // Update PQ status to "CopiedToOrder"
  //           if (quotation._id && !pqStatusUpdated) {
  //             try {
  //               await axios.put(
  //                 `/api/purchase-quotation/${quotation._id}`,
  //                 { status: "CopiedToOrder" }
  //               );
  //               setPqStatusUpdated(true);
  //             } catch (err) {
  //               console.error("Failed to update PQ status:", err);
  //               setError("Failed to lock PQ: " + err.message);
  //               return;
  //             }
  //           }

  //           // Validate quotation structure
  //           if (!quotation || typeof quotation !== "object") {
  //             throw new Error("Invalid quotation data");
  //           }
            
  //           // Ensure items is an array
  //           if (!Array.isArray(quotation.items)) {
  //             console.warn("Quotation items is not an array, defaulting to empty array:", quotation.items);
  //             quotation.items = [];
  //           }
            
  //           // Store original PQ items for quantity validation
  //           setOriginalPQItems(quotation.items.map(item => ({
  //             itemCode: item.itemCode,
  //             maxQuantity: item.quantity
  //           })));
            
  //           setFormData({
  //             ...initialState,
  //             ...quotation,
  //             sourceQuotationId: quotation._id || "",
  //             supplier: quotation.supplier?._id || quotation.supplier || "",
  //             supplierCode: quotation.supplierCode || "",
  //             supplierName: quotation.supplierName || "",
  //             contactPerson: quotation.contactPerson || "",
  //             orderStatus: quotation.orderStatus || quotation.status || "Open",
  //             paymentStatus: quotation.paymentStatus || "Pending",
  //             stockStatus: quotation.stockStatus || "Not Updated",
  //             postingDate: formatDateForInput(quotation.postingDate),
  //             validUntil: formatDateForInput(quotation.validUntil),
  //             documentDate: formatDateForInput(quotation.documentDate),
  //             items: quotation.items.length > 0
  //               ? quotation.items.map((item) => {
  //                   const computed = computeItemValues({
  //                     ...item,
  //                     quantity: item.quantity || 0,
  //                     unitPrice: item.unitPrice || 0,
  //                     discount: item.discount || 0,
  //                     freight: item.freight || 0,
  //                     gstRate: item.gstRate || 0,
  //                     taxOption: item.taxOption || "GST",
  //                   });
  //                   return {
  //                     ...initialState.items[0],
  //                     ...item,
  //                     ...computed,
  //                     item: item.item?._id || item.item || "",
  //                     itemCode: item.itemCode || "",
  //                     itemName: item.itemName || "",
  //                     itemDescription: item.itemDescription || "",
  //                     orderedQuantity: item.quantity || item.orderedQuantity || 0,
  //                     receivedQuantity: item.receivedQuantity || 0,
  //                     quantity: item.quantity || 0,
  //                     unitPrice: item.unitPrice || 0,
  //                     discount: item.discount || 0,
  //                     freight: item.freight || 0,
  //                     gstRate: item.gstRate || 0,
  //                     taxOption: item.taxOption || "GST",
  //                     igstRate: item.igstRate || 0,
  //                     tdsAmount: item.tdsAmount || 0,
  //                     managedBy: item.managedBy || "",
  //                     batches: item.batches || [],
  //                     qualityCheckDetails: item.qualityCheckDetails || [],
  //                     warehouse: item.warehouse?._id || item.warehouse || "",
  //                     warehouseCode: item.warehouseCode || "",
  //                     warehouseName: item.warehouseName || "",
  //                     stockAdded: item.stockAdded || false,
  //                   };
  //                 })
  //               : [{ ...initialState.items[0] }],
  //             gstTotal: quotation.gstTotal || quotation.gstAmount || 0,
  //             grandTotal: quotation.grandTotal || 0,
  //           });
  //         } catch (err) {
  //           console.error("Error parsing sessionStorage data:", err);
  //           setError("Failed to load quotation data: " + err.message);
  //         }
  //       }
  //     }
  //     // Fetch from API if editId exists
  //     else if (editId && /^[0-9a-fA-F]{24}$/.test(editId)) {
  //       setLoading(true);
  //       try {
  //         const res = await axios.get(`/api/purchase-order/${editId}`);
  //         if (!res.data.success) {
  //           throw new Error(res.data.error || "Failed to load purchase order");
  //         }
  //         const record = res.data.data;
  //         if (!Array.isArray(record.items)) {
  //           console.warn("Items is not an array, defaulting to empty array:", record.items);
  //           record.items = [];
  //         }
  //         setFormData({
  //           ...initialState,
  //           ...record,
  //           supplier: record.supplier?._id || record.supplier || "",
  //           supplierCode: record.supplierCode || "",
  //           supplierName: record.supplier?.supplierName || record.supplierName || "",
  //           contactPerson: record.supplier?.contactPerson || record.contactPerson || "",
  //           orderStatus: record.orderStatus || "Open",
  //           paymentStatus: record.paymentStatus || "Pending",
  //           stockStatus: record.stockStatus || "Not Updated",
  //           postingDate: formatDateForInput(record.postingDate),
  //           validUntil: formatDateForInput(record.validUntil),
  //           documentDate: formatDateForInput(record.documentDate),
  //           items: record.items.length > 0
  //             ? record.items.map((item) => ({
  //                 ...initialState.items[0],
  //                 ...item,
  //                 item: item.item?._id || item.item || "",
  //                 itemCode: item.item?.itemCode || item.itemCode || "",
  //                 itemName: item.item?.itemName || item.itemName || "",
  //                 itemDescription: item.itemDescription || "",
  //                 orderedQuantity: item.orderedQuantity || 0,
  //                 receivedQuantity: item.receivedQuantity || 0,
  //                 quantity: item.quantity || 0,
  //                 unitPrice: item.unitPrice || 0,
  //                 discount: item.discount || 0,
  //                 freight: item.freight || 0,
  //                 gstRate: item.gstRate || 0,
  //                 taxOption: item.taxOption || "GST",
  //                 priceAfterDiscount: item.priceAfterDiscount || 0,
  //                 totalAmount: item.totalAmount || 0,
  //                 gstAmount: item.gstAmount || 0,
  //                 cgstAmount: item.cgstAmount || 0,
  //                 sgstAmount: item.sgstAmount || 0,
  //                 igstRate: item.igstRate || 0,
  //                 igstAmount: item.igstAmount || 0,
  //                 tdsAmount: item.tdsAmount || 0,
  //                 managedBy: item.managedBy || "",
  //                 batches: item.batches || [],
  //                 qualityCheckDetails: item.qualityCheckDetails || [],
  //                 warehouse: item.warehouse?._id || item.warehouse || "",
  //                 warehouseCode: item.warehouse?.warehouseCode || item.warehouseCode || "",
  //                 warehouseName: item.warehouse?.warehouseName || item.warehouseName || "",
  //                 stockAdded: item.stockAdded || false,
  //               }))
  //             : [{ ...initialState.items[0] }],
  //           gstTotal: record.gstTotal || 0,
  //         });
  //       } catch (err) {
  //         console.error("Error fetching purchase order:", err);
  //         setError("Error loading purchase order: " + (err.message || "Unknown error"));
  //       } finally {
  //         setLoading(false);
  //       }
  //     } else if (editId) {
  //       setError("Invalid purchase order ID");
  //     }
  //   };

  //   loadFormData();
  // }, [editId, pqStatusUpdated]);




useEffect(() => {
  let quotationIdToRestore = null;

  const loadFormData = async () => {
    // Initialize from sessionStorage if no editId
    if (!editId) {
      const storedData = sessionStorage.getItem("purchaseOrderData");
      if (storedData) {
        try {
          const quotation = JSON.parse(storedData);

          // Save for cleanup
          quotationIdToRestore = quotation._id;

         // Update PQ status to "CopiedToOrder"
          if (quotation._id && !pqStatusUpdated) {
            try {
              await axios.put(`/api/purchase-quotation/${quotation._id}`, { status: "CopiedToOrder" });
              setPqStatusUpdated(true);
            } catch (err) {
              console.error("Failed to update PQ status:", err);
              setError("Failed to lock PQ: " + err.message);
              return;
            }
          }

          if (!quotation || typeof quotation !== "object") {
            throw new Error("Invalid quotation data");
          }

          if (!Array.isArray(quotation.items)) {
            console.warn("Quotation items is not an array, defaulting to empty array:", quotation.items);
            quotation.items = [];
          }

          // Store original PQ items for quantity validation
          setOriginalPQItems(quotation.items.map(item => ({
            itemCode: item.itemCode,
            maxQuantity: item.quantity - (item.orderedQuantity || 0) // Adjusted to account for already ordered quantity,
          })));

          setFormData({
            ...initialState,
            ...quotation,
            sourceQuotationId: quotation._id || "",
            supplier: quotation.supplier?._id || quotation.supplier || "",
            supplierCode: quotation.supplierCode || "",
            supplierName: quotation.supplierName || "",
            contactPerson: quotation.contactPerson || "",
            orderStatus: quotation.orderStatus || quotation.status || "Open",
            paymentStatus: quotation.paymentStatus || "Pending",
            stockStatus: quotation.stockStatus || "Not Updated",
            postingDate: formatDateForInput(quotation.postingDate),
            validUntil: formatDateForInput(quotation.validUntil),
            documentDate: formatDateForInput(quotation.documentDate),
            items: quotation.items.length > 0
              ? quotation.items.map((item) => {
                  const computed = computeItemValues({
                    ...item,
                    quantity: item.quantity - item.orderedQuantity || 0,
                    orderedQuantity: item.quantity || 0,
                    unitPrice: item.unitPrice || 0,
                    discount: item.discount || 0,
                    freight: item.freight || 0,
                    gstRate: item.gstRate || 0,
                    taxOption: item.taxOption || "GST",
                  });
                  return {
                    ...initialState.items[0],
                    ...item,
                    ...computed,
                    item: item.item?._id || item.item || "",
                    itemCode: item.itemCode || "",
                    itemName: item.itemName || "",
                    itemDescription: item.itemDescription || "",
                    orderedQuantity: 0,
                    receivedQuantity: item.receivedQuantity || 0,
                    quantity: item.quantity - item.orderedQuantity || 0,
                    unitPrice: item.unitPrice || 0,
                    discount: item.discount || 0,
                    freight: item.freight || 0,
                    gstRate: item.gstRate || 0,
                    taxOption: item.taxOption || "GST",
                    igstRate: item.igstRate || 0,
                    tdsAmount: item.tdsAmount || 0,
                    managedBy: item.managedBy || "",
                    batches: item.batches || [],
                    qualityCheckDetails: item.qualityCheckDetails || [],
                    warehouse: item.warehouse?._id || item.warehouse || "",
                    warehouseCode: item.warehouseCode || "",
                    warehouseName: item.warehouseName || "",
                    stockAdded: item.stockAdded || false,
                  };
                })
              : [{ ...initialState.items[0] }],
            gstTotal: quotation.gstTotal || quotation.gstAmount || 0,
            grandTotal: quotation.grandTotal || 0,
          });
        } catch (err) {
          console.error("Error parsing sessionStorage data:", err);
          setError("Failed to load quotation data: " + err.message);
        }
      }
    }
    // Load PO by editId
    else if (editId && /^[0-9a-fA-F]{24}$/.test(editId)) {
      setLoading(true);
      try {
        const res = await axios.get(`/api/purchase-order/${editId}`);
        if (!res.data.success) {
          throw new Error(res.data.error || "Failed to load purchase order");
        }
        const record = res.data.data;
        if (!Array.isArray(record.items)) {
          console.warn("Items is not an array, defaulting to empty array:", record.items);
          record.items = [];
        }
        setFormData({
          ...initialState,
          ...record,
          supplier: record.supplier?._id || record.supplier || "",
          supplierCode: record.supplierCode || "",
          supplierName: record.supplier?.supplierName || record.supplierName || "",
          contactPerson: record.supplier?.contactPerson || record.contactPerson || "",
          orderStatus: record.orderStatus || "Open",
          paymentStatus: record.paymentStatus || "Pending",
          stockStatus: record.stockStatus || "Not Updated",
          postingDate: formatDateForInput(record.postingDate),
          validUntil: formatDateForInput(record.validUntil),
          documentDate: formatDateForInput(record.documentDate),
          items: record.items.length > 0
            ? record.items.map((item) => ({
                ...initialState.items[0],
                ...item,
                item: item.item?._id || item.item || "",
                itemCode: item.item?.itemCode || item.itemCode || "",
                itemName: item.item?.itemName || item.itemName || "",
                itemDescription: item.itemDescription || "",
                orderedQuantity:  0,
                receivedQuantity: item.receivedQuantity || 0,
                quantity: item.quantity || 0,
                unitPrice: item.unitPrice || 0,
                discount: item.discount || 0,
                freight: item.freight || 0,
                gstRate: item.gstRate || 0,
                taxOption: item.taxOption || "GST",
                priceAfterDiscount: item.priceAfterDiscount || 0,
                totalAmount: item.totalAmount || 0,
                gstAmount: item.gstAmount || 0,
                cgstAmount: item.cgstAmount || 0,
                sgstAmount: item.sgstAmount || 0,
                igstRate: item.igstRate || 0,
                igstAmount: item.igstAmount || 0,
                tdsAmount: item.tdsAmount || 0,
                managedBy: item.managedBy || "",
                batches: item.batches || [],
                qualityCheckDetails: item.qualityCheckDetails || [],
                warehouse: item.warehouse?._id || item.warehouse || "",
                warehouseCode: item.warehouse?.warehouseCode || item.warehouseCode || "",
                warehouseName: item.warehouse?.warehouseName || item.warehouseName || "",
                stockAdded: item.stockAdded || false,
              }))
            : [{ ...initialState.items[0] }],
          gstTotal: record.gstTotal || 0,
        });
      } catch (err) {
        console.error("Error fetching purchase order:", err);
        setError("Error loading purchase order: " + (err.message || "Unknown error"));
      } finally {
        setLoading(false);
      }
    } else if (editId) {
      setError("Invalid purchase order ID");
    }
  };

  loadFormData();

  return () => {
    // 🛑 Restore PQ status if PO was not saved
    if (!editId && quotationIdToRestore) {
      axios.put(`/api/purchase-quotation/${quotationIdToRestore}`, { status: "Open" })
        .then(() => {
          console.log("PQ status restored to 'Open' on PO cancel/exit");
        })
        .catch((err) => {
          console.error("Failed to restore PQ status on cleanup:", err);
        });
    }
  };
}, [editId, pqStatusUpdated]);




  const handleSupplierSelect = useCallback((selectedSupplier) => {
    setFormData((prev) => ({
      ...prev,
      supplier: selectedSupplier._id || "",
      supplierCode: selectedSupplier.supplierCode || "",
      supplierName: selectedSupplier.supplierName || "",
      contactPerson: selectedSupplier.contactPersonName || "",
    }));
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleItemChange = useCallback((index, e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      const numericFields = [
        "orderedQuantity",
        "receivedQuantity",
        "quantity",
        "unitPrice",
        "discount",
        "freight",
        "gstRate",
        "cgstRate",
        "sgstRate",
        "igstRate",
        "tdsAmount",
      ];
      let newValue = numericFields.includes(name) ? parseFloat(value) || 0 : value;
      
      // Enforce quantity cannot exceed original PQ quantity
      if (name === "quantity" && originalPQItems.length > 0) {
        const itemCode = updatedItems[index].itemCode;
        const originalItem = originalPQItems.find(item => item.itemCode === itemCode);
        
        if (originalItem) {
          const maxQuantity = originalItem.maxQuantity;
          if (newValue > maxQuantity) {
            alert(`Quantity cannot exceed ${maxQuantity} as per the original quotation`);
            newValue = maxQuantity;
          }
        }
      }
      
      updatedItems[index] = { ...updatedItems[index], [name]: newValue };
      
      if (name === "quantity") {
        updatedItems[index].orderedQuantity = newValue;
      }
      
      // Recompute values if relevant fields change
      if (["quantity", "unitPrice", "discount", "freight", "gstRate", "igstRate", "taxOption"].includes(name)) {
        const computed = computeItemValues(updatedItems[index]);
        updatedItems[index] = { ...updatedItems[index], ...computed };
      }
      
      return { ...prev, items: updatedItems };
    });
  }, [originalPQItems]);

  const addItemRow = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { ...initialState.items[0] },
      ],
    }));
  }, []);

  const handleRemoveItem = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  useEffect(() => {
    const totalBeforeDiscount = round(
      formData.items.reduce((acc, item) => {
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const discount = parseFloat(item.discount) || 0;
        const quantity = parseFloat(item.quantity) || 0;
        return acc + (unitPrice - discount) * quantity;
      }, 0)
    );

    const totalItems = round(
      formData.items.reduce((acc, item) => acc + (parseFloat(item.totalAmount) || 0), 0)
    );

    const gstTotal = round(
      formData.items.reduce((acc, item) => {
        return acc + (parseFloat(item.taxOption === "IGST" ? item.igstAmount : item.gstAmount) || 0);
      }, 0)
    );

    const overallFreight = round(parseFloat(formData.freight) || 0);
    const rounding = round(parseFloat(formData.rounding) || 0);
    const totalDownPayment = round(parseFloat(formData.totalDownPayment) || 0);
    const appliedAmounts = round(parseFloat(formData.appliedAmounts) || 0);

    const grandTotal = round(totalItems + gstTotal + overallFreight + rounding);
    const openBalance = round(grandTotal - (totalDownPayment + appliedAmounts));

    setFormData((prev) => ({
      ...prev,
      totalBeforeDiscount,
      gstTotal,
      grandTotal,
      openBalance,
    }));
  }, [formData.items, formData.freight, formData.rounding, formData.totalDownPayment, formData.appliedAmounts]);

  const handleSubmit = async () => {
    // Validate quantities don't exceed original PQ
    if (formData.sourceQuotationId && originalPQItems.length > 0) {
      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i];
        const originalItem = originalPQItems.find(pqItem => pqItem.itemCode === item.itemCode);
        
        if (originalItem && item.quantity > originalItem.maxQuantity) {
          alert(`Quantity for ${item.itemName || item.itemCode} exceeds original quotation quantity of ${originalItem.maxQuantity}`);
          return;
        }
      }
    }
    
    if (!formData.supplierName || !formData.supplierCode) {
      alert("Please select a valid supplier");
      return;
    }
    if (formData.items.length === 0 || formData.items.every((item) => !item.itemName)) {
      alert("Please add at least one valid item");
      return;
    }
    
  setLoading(true);
  //submittedRef.current = true; // Mark as submitted to prevent cleanup restoration
  
  try {
    if (editId) {
      // Update existing PO
      const response = await axios.put(`/api/purchase-order/${editId}`, formData);
      alert(response.data.message);
      router.push("/admin/purchase-order-view");
    } else {
      // Create new PO
      const hasZeroQty = formData.items.some(
    (it) => Number(it.quantity) === 0 || it.quantity === ""
  );
    if (hasZeroQty) {
   alert("Quantity must be at least 1 for every item.");
    return;               // ⛔ don’t send the POST request
  }
  
      const response = await axios.post("/api/purchase-order", formData);
      
      // Update PQ status and ordered quantities if created from quotation
      if (formData.sourceQuotationId) {
        try {
          // Get current PQ
          const pqRes = await axios.get(`/api/purchase-quotation/${formData.sourceQuotationId}`);
          const pq = pqRes.data.data;
          
          // Create updated items with accumulated ordered quantities
          const updatedItems = pq.items.map(pqItem => {
            const poItem = formData.items.find(item => 
              item.itemCode === pqItem.itemCode
            );

            
            if (poItem) {
              return {
                ...pqItem,
                orderedQuantity: (pqItem.orderedQuantity || 0) + poItem.quantity
              };
            }
            return pqItem;
          });
          
          // Check if PQ is fully ordered
          const isFullyOrdered = updatedItems.every(item => 
            item.orderedQuantity >= item.quantity
          );
          
          // Update PQ with new ordered quantities and status
          await axios.put(
            `/api/purchase-quotation/${formData.sourceQuotationId}`,
            { 
              items: updatedItems,
              status: isFullyOrdered ? "FullyOrdered" : "PartiallyOrdered"
            }
          );
        } catch (err) {
          console.error("Failed to update PQ items and status:", err);
          alert("PO created but failed to update quotation");
        }
      }
      
      alert(response.data.message);
      setFormData(initialState);
    }
    
    // Clear session storage and redirect
    sessionStorage.removeItem("purchaseOrderData");
    router.push("/admin/purchase-order-view");
  } catch (error) {
    // submittedRef.current = false; // Allow restoration on next unmount
    console.error("Error saving purchase order:", error);
    alert(`Failed to ${editId ? "update" : "add"} purchase order: ${error.response?.data?.message || error.message}`);
  } finally {
    setLoading(false);
  }
};

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="m-11 p-5 shadow-xl">
      <h1 className="text-2xl font-bold mb-4">{editId ? "Edit Purchase Order" : "Create Purchase Order"}</h1>
      
      {/* Banner for converted PQs */}
      {formData.sourceQuotationId && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
          <p className="font-semibold">Converted from Purchase Quotation</p>
          <p>Source Quotation ID: {formData.sourceQuotationId}</p>
          <p className="text-sm italic mt-2">
            Note: Item quantities cannot exceed original quotation quantities
          </p>
        </div>
      )}
      
      <div className="flex flex-wrap justify-between m-10 p-5 border rounded-lg shadow-lg">
        <div className="grid grid-cols-2 gap-7">
          <div>
            <label className="block mb-2 font-medium">Supplier Name</label>
            <SupplierSearch
              onSelectSupplier={handleSupplierSelect}
              initialSupplier={
                formData.supplier
                  ? { 
                      _id: formData.supplier, 
                      supplierName: formData.supplierName,
                      supplierCode: formData.supplierCode,
                      contactPersonName: formData.contactPerson
                    }
                  : undefined
              }
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Supplier Code</label>
            <input
              type="text"
              name="supplierCode"
              value={formData.supplierCode || ""}
              readOnly
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Contact Person</label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson || ""}
              readOnly
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Reference Number</label>
            <input
              type="text"
              name="refNumber"
              value={formData.refNumber || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div className="w-full md:w-1/2 space-y-4">
          <div>
            <label className="block mb-2 font-medium">Order Status</label>
            <select
              name="orderStatus"
              value={formData.orderStatus || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="Open">Open</option>
              <option value="Close">Close</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium">Posting Date</label>
            <input
              type="date"
              name="postingDate"
              value={formData.postingDate || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Delivery Date</label>
            <input
              type="date"
              name="documentDate"
              value={formData.documentDate || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>
      
      <h2 className="text-xl font-semibold mt-6">Items</h2>
      <div className="flex flex-col m-10 p-5 border rounded-lg shadow-lg">
        <ItemSection
          items={formData.items}
          onItemChange={handleItemChange}
          onAddItem={addItemRow}
          onRemoveItem={handleRemoveItem}
          computeItemValues={computeItemValues}
          fromQuotation={!!formData.sourceQuotationId}
          originalPQItems={originalPQItems}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 m-8 border rounded-lg shadow-lg">
        <div>
          <label className="block mb-2 font-medium">Sales Employee</label>
          <input
            type="text"
            name="salesEmployee"
            value={formData.salesEmployee || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">Remarks</label>
          <textarea
            name="remarks"
            value={formData.remarks || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            rows="3"
          ></textarea>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 m-8 border rounded-lg shadow-lg">
        <div>
          <label className="block mb-2 font-medium">Taxable Amount</label>
          <input
            type="number"
            name="totalBeforeDiscount"
            value={formData.totalBeforeDiscount || 0}
            readOnly
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">Rounding</label>
          <input
            type="number"
            name="rounding"
            value={formData.rounding || 0}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">GST</label>
          <input
            type="number"
            name="gstTotal"
            value={formData.gstTotal || 0}
            readOnly
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">Total Amount</label>
          <input
            type="number"
            name="grandTotal"
            value={formData.grandTotal || 0}
            readOnly
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 p-8 m-8 border rounded-lg shadow-lg">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-400 hover:bg-orange-300"
          }`}
        >
          {loading ? "Saving..." : editId ? "Update" : "Add"}
        </button>
        <button
          onClick={() => {
            sessionStorage.removeItem("purchaseOrderData");
            router.push("/admin/purchase-order-view");
          }}
          className="px-4 py-2 bg-orange-400 text-white rounded hover:bg-orange-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default OrderFormWrapper;


// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import axios from "axios";
// import ItemSection from "@/components/ItemSection";
// import SupplierSearch from "@/components/SupplierSearch";
// import { Suspense } from "react";

// const round = (num, decimals = 2) => {
//   const n = Number(num);
//   if (isNaN(n)) return 0;
//   return Number(n.toFixed(decimals));
// };

// const computeItemValues = (item) => {
//   const quantity = parseFloat(item.quantity) || 0;
//   const unitPrice = parseFloat(item.unitPrice) || 0;
//   const discount = parseFloat(item.discount) || 0;
//   const freight = parseFloat(item.freight) || 0;
//   const priceAfterDiscount = round(unitPrice - discount);
//   const totalAmount = round(quantity * priceAfterDiscount + freight);

//   if (item.taxOption === "GST") {
//     const gstRate = parseFloat(item.gstRate) || 0;
//     const cgstRate = item.cgstRate !== undefined ? parseFloat(item.cgstRate) : gstRate / 2;
//     const sgstRate = item.sgstRate !== undefined ? parseFloat(item.sgstRate) : gstRate / 2;
//     const cgstAmount = round(totalAmount * (cgstRate / 100));
//     const sgstAmount = round(totalAmount * (sgstRate / 100));
//     const gstAmount = round(cgstAmount + sgstAmount);
//     return {
//       priceAfterDiscount,
//       totalAmount,
//       gstAmount,
//       cgstAmount,
//       sgstAmount,
//       igstAmount: 0,
//     };
//   }

//   if (item.taxOption === "IGST") {
//     let igstRate = item.igstRate;
//     if (igstRate === undefined || parseFloat(igstRate) === 0) {
//       igstRate = item.gstRate !== undefined ? parseFloat(item.gstRate) : 0;
//     } else {
//       igstRate = parseFloat(igstRate);
//     }
//     const igstAmount = round(totalAmount * (igstRate / 100));
//     return {
//       priceAfterDiscount,
//       totalAmount,
//       gstAmount: 0,
//       cgstAmount: 0,
//       sgstAmount: 0,
//       igstAmount,
//     };
//   }

//   return {
//     priceAfterDiscount,
//     totalAmount,
//     gstAmount: 0,
//     cgstAmount: 0,
//     sgstAmount: 0,
//     igstAmount: 0,
//   };
// };

// const initialState = {
//   sourceQuotationId: "",
//   supplier: "",
//   supplierCode: "",
//   supplierName: "",
//   contactPerson: "",
//   refNumber: "",
//   orderStatus: "Open",
//   paymentStatus: "Pending",
//   stockStatus: "Not Updated",
//   postingDate: "",
//   validUntil: "",
//   documentDate: "",
//   items: [
//     {
//       item: "",
//       itemCode: "",
//       itemName: "",
//       itemDescription: "",
//       orderedQuantity: 0,
//       receivedQuantity: 0,
//       quantity: 0,
//       unitPrice: 0,
//       discount: 0,
//       freight: 0,
//       gstRate: 0,
//       taxOption: "GST",
//       priceAfterDiscount: 0,
//       totalAmount: 0,
//       gstAmount: 0,
//       cgstAmount: 0,
//       sgstAmount: 0,
//       igstRate: 0,
//       igstAmount: 0,
//       tdsAmount: 0,
//       managedBy: "",
//       batches: [],
//       qualityCheckDetails: [],
//       warehouse: "",
//       warehouseCode: "",
//       warehouseName: "",
//       stockAdded: false,
//     },
//   ],
//   salesEmployee: "",
//   remarks: "",
//   freight: 0,
//   rounding: 0,
//   totalBeforeDiscount: 0,
//   totalDownPayment: 0,
//   appliedAmounts: 0,
//   gstTotal: 0,
//   grandTotal: 0,
//   openBalance: 0,
// };

// function formatDateForInput(date) {
//   if (!date) return "";
//   const d = new Date(date);
//   if (isNaN(d.getTime())) return "";
//   const year = d.getFullYear();
//   const month = ("0" + (d.getMonth() + 1)).slice(-2);
//   const day = ("0" + d.getDate()).slice(-2);
//   return `${year}-${month}-${day}`;
// }

// function OrderFormWrapper() {
//   return (
//     <Suspense fallback={<div className="text-center py-10">Loading form data...</div>}>
//       <OrderForm />
//     </Suspense>
//   );
// }

// function OrderForm() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const editId = searchParams.get("editId");
//   const [formData, setFormData] = useState(initialState);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [pqStatusUpdated, setPqStatusUpdated] = useState(false);

//   useEffect(() => {
//     const loadFormData = async () => {
//       // Initialize from sessionStorage if no editId
//       if (!editId) {
//         const storedData = sessionStorage.getItem("purchaseOrderData");
//         if (storedData) {
//           try {
//             const quotation = JSON.parse(storedData);
            
//             // Update PQ status to "CopiedToOrder"
//             if (quotation._id && !pqStatusUpdated) {
//               try {
//                 await axios.put(
//                   `/api/purchase-quotation/${quotation._id}`,
//                   { status: "CopiedToOrder" }
//                 );
//                 setPqStatusUpdated(true);
//                 console.log("PQ status updated to CopiedToOrder");
//               } catch (err) {
//                 console.error("Failed to update PQ status:", err);
//                 setError("Failed to lock PQ: " + err.message);
//                 return;
//               }
//             }

//             // Validate quotation structure
//             if (!quotation || typeof quotation !== "object") {
//               throw new Error("Invalid quotation data");
//             }
            
//             // Ensure items is an array
//             if (!Array.isArray(quotation.items)) {
//               console.warn("Quotation items is not an array, defaulting to empty array:", quotation.items);
//               quotation.items = [];
//             }
            
//             setFormData({
//               ...initialState,
//               ...quotation,
//               sourceQuotationId: quotation._id || "",
//               supplier: quotation.supplier?._id || quotation.supplier || "",
//               supplierCode: quotation.supplierCode || "",
//               supplierName: quotation.supplierName || "",
//               contactPerson: quotation.contactPerson || "",
//               orderStatus: quotation.orderStatus || quotation.status || "Open",
//               paymentStatus: quotation.paymentStatus || "Pending",
//               stockStatus: quotation.stockStatus || "Not Updated",
//               postingDate: formatDateForInput(quotation.postingDate),
//               validUntil: formatDateForInput(quotation.validUntil),
//               documentDate: formatDateForInput(quotation.documentDate),
//               items: quotation.items.length > 0
//                 ? quotation.items.map((item) => {
//                     const computed = computeItemValues({
//                       ...item,
//                       quantity: item.quantity || 0,
//                       unitPrice: item.unitPrice || 0,
//                       discount: item.discount || 0,
//                       freight: item.freight || 0,
//                       gstRate: item.gstRate || 0,
//                       taxOption: item.taxOption || "GST",
//                     });
//                     return {
//                       ...initialState.items[0],
//                       ...item,
//                       ...computed,
//                       item: item.item?._id || item.item || "",
//                       itemCode: item.itemCode || "",
//                       itemName: item.itemName || "",
//                       itemDescription: item.itemDescription || "",
//                       orderedQuantity: item.quantity || item.orderedQuantity || 0,
//                       receivedQuantity: item.receivedQuantity || 0,
//                       quantity: item.quantity || 0,
//                       unitPrice: item.unitPrice || 0,
//                       discount: item.discount || 0,
//                       freight: item.freight || 0,
//                       gstRate: item.gstRate || 0,
//                       taxOption: item.taxOption || "GST",
//                       igstRate: item.igstRate || 0,
//                       tdsAmount: item.tdsAmount || 0,
//                       managedBy: item.managedBy || "",
//                       batches: item.batches || [],
//                       qualityCheckDetails: item.qualityCheckDetails || [],
//                       warehouse: item.warehouse?._id || item.warehouse || "",
//                       warehouseCode: item.warehouseCode || "",
//                       warehouseName: item.warehouseName || "",
//                       stockAdded: item.stockAdded || false,
//                     };
//                   })
//                 : [{ ...initialState.items[0] }],
//               gstTotal: quotation.gstTotal || quotation.gstAmount || 0,
//               grandTotal: quotation.grandTotal || 0,
//             });
//           } catch (err) {
//             console.error("Error parsing sessionStorage data:", err);
//             setError("Failed to load quotation data: " + err.message);
//           }
//         }
//       }
//       // Fetch from API if editId exists
//       else if (editId && /^[0-9a-fA-F]{24}$/.test(editId)) {
//         setLoading(true);
//         try {
//           const res = await axios.get(`/api/purchase-order/${editId}`);
//           if (!res.data.success) {
//             throw new Error(res.data.error || "Failed to load purchase order");
//           }
//           const record = res.data.data;
//           console.log("Fetched purchase order:", record);
//           if (!Array.isArray(record.items)) {
//             console.warn("Items is not an array, defaulting to empty array:", record.items);
//             record.items = [];
//           }
//           setFormData({
//             ...initialState,
//             ...record,
//             supplier: record.supplier?._id || record.supplier || "",
//             supplierCode: record.supplierCode || "",
//             supplierName: record.supplier?.supplierName || record.supplierName || "",
//             contactPerson: record.supplier?.contactPerson || record.contactPerson || "",
//             orderStatus: record.orderStatus || "Open",
//             paymentStatus: record.paymentStatus || "Pending",
//             stockStatus: record.stockStatus || "Not Updated",
//             postingDate: formatDateForInput(record.postingDate),
//             validUntil: formatDateForInput(record.validUntil),
//             documentDate: formatDateForInput(record.documentDate),
//             items: record.items.length > 0
//               ? record.items.map((item) => ({
//                   ...initialState.items[0],
//                   ...item,
//                   item: item.item?._id || item.item || "",
//                   itemCode: item.item?.itemCode || item.itemCode || "",
//                   itemName: item.item?.itemName || item.itemName || "",
//                   itemDescription: item.itemDescription || "",
//                   orderedQuantity: item.orderedQuantity || 0,
//                   receivedQuantity: item.receivedQuantity || 0,
//                   quantity: item.quantity || 0,
//                   unitPrice: item.unitPrice || 0,
//                   discount: item.discount || 0,
//                   freight: item.freight || 0,
//                   gstRate: item.gstRate || 0,
//                   taxOption: item.taxOption || "GST",
//                   priceAfterDiscount: item.priceAfterDiscount || 0,
//                   totalAmount: item.totalAmount || 0,
//                   gstAmount: item.gstAmount || 0,
//                   cgstAmount: item.cgstAmount || 0,
//                   sgstAmount: item.sgstAmount || 0,
//                   igstRate: item.igstRate || 0,
//                   igstAmount: item.igstAmount || 0,
//                   tdsAmount: item.tdsAmount || 0,
//                   managedBy: item.managedBy || "",
//                   batches: item.batches || [],
//                   qualityCheckDetails: item.qualityCheckDetails || [],
//                   warehouse: item.warehouse?._id || item.warehouse || "",
//                   warehouseCode: item.warehouse?.warehouseCode || item.warehouseCode || "",
//                   warehouseName: item.warehouse?.warehouseName || item.warehouseName || "",
//                   stockAdded: item.stockAdded || false,
//                 }))
//               : [{ ...initialState.items[0] }],
//             gstTotal: record.gstTotal || 0,
//           });
//         } catch (err) {
//           console.error("Error fetching purchase order:", err);
//           setError("Error loading purchase order: " + (err.message || "Unknown error"));
//         } finally {
//           setLoading(false);
//         }
//       } else if (editId) {
//         setError("Invalid purchase order ID");
//       }
//     };

//     loadFormData();
//   }, [editId, pqStatusUpdated]);

//   const handleSupplierSelect = useCallback((selectedSupplier) => {
//     setFormData((prev) => ({
//       ...prev,
//       supplier: selectedSupplier._id || "",
//       supplierCode: selectedSupplier.supplierCode || "",
//       supplierName: selectedSupplier.supplierName || "",
//       contactPerson: selectedSupplier.contactPersonName || "",
//     }));
//   }, []);

//   const handleInputChange = useCallback((e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   }, []);

//   const handleItemChange = useCallback((index, e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => {
//       const updatedItems = [...prev.items];
//       const numericFields = [
//         "orderedQuantity",
//         "receivedQuantity",
//         "quantity",
//         "unitPrice",
//         "discount",
//         "freight",
//         "gstRate",
//         "cgstRate",
//         "sgstRate",
//         "igstRate",
//         "tdsAmount",
//         "priceAfterDiscount",
//         "totalAmount",
//         "gstAmount",
//         "cgstAmount",
//         "sgstAmount",
//         "igstAmount",
//       ];
//       const newValue = numericFields.includes(name) ? parseFloat(value) || 0 : value;
//       updatedItems[index] = { ...updatedItems[index], [name]: newValue };
//       if (name === "quantity") {
//         updatedItems[index].orderedQuantity = newValue; // Sync orderedQuantity
//       }
//       // Recompute values if relevant fields change
//       if (["quantity", "unitPrice", "discount", "freight", "gstRate", "igstRate", "taxOption"].includes(name)) {
//         const computed = computeItemValues(updatedItems[index]);
//         updatedItems[index] = { ...updatedItems[index], ...computed };
//       }
//       return { ...prev, items: updatedItems };
//     });
//   }, []);

//   const addItemRow = useCallback(() => {
//     setFormData((prev) => ({
//       ...prev,
//       items: [
//         ...prev.items,
//         { ...initialState.items[0] },
//       ],
//     }));
//   }, []);

//   const handleRemoveItem = useCallback((index) => {
//     setFormData((prev) => ({
//       ...prev,
//       items: prev.items.filter((_, i) => i !== index),
//     }));
//   }, []);

//   useEffect(() => {
//     const totalBeforeDiscount = round(
//       formData.items.reduce((acc, item) => {
//         const unitPrice = parseFloat(item.unitPrice) || 0;
//         const discount = parseFloat(item.discount) || 0;
//         const quantity = parseFloat(item.quantity) || 0;
//         return acc + (unitPrice - discount) * quantity;
//       }, 0)
//     );

//     const totalItems = round(
//       formData.items.reduce((acc, item) => acc + (parseFloat(item.totalAmount) || 0), 0)
//     );

//     const gstTotal = round(
//       formData.items.reduce((acc, item) => {
//         return acc + (parseFloat(item.taxOption === "IGST" ? item.igstAmount : item.gstAmount) || 0);
//       }, 0)
//     );

//     const overallFreight = round(parseFloat(formData.freight) || 0);
//     const rounding = round(parseFloat(formData.rounding) || 0);
//     const totalDownPayment = round(parseFloat(formData.totalDownPayment) || 0);
//     const appliedAmounts = round(parseFloat(formData.appliedAmounts) || 0);

//     const grandTotal = round(totalItems + gstTotal + overallFreight + rounding);
//     const openBalance = round(grandTotal - (totalDownPayment + appliedAmounts));

//     setFormData((prev) => ({
//       ...prev,
//       totalBeforeDiscount,
//       gstTotal,
//       grandTotal,
//       openBalance,
//     }));
//   }, [formData.items, formData.freight, formData.rounding, formData.totalDownPayment, formData.appliedAmounts]);

//   const handleSubmit = async () => {
//     if (!formData.supplierName || !formData.supplierCode) {
//       alert("Please select a valid supplier");
//       return;
//     }
//     if (formData.items.length === 0 || formData.items.every((item) => !item.itemName)) {
//       alert("Please add at least one valid item");
//       return;
//     }
//     setLoading(true);
    
//     // Prepare payload with correct status fields
//     const payload = {
//       ...formData,
//       orderStatus: formData.orderStatus || "Open",
//       paymentStatus: formData.paymentStatus || "Pending",
//       stockStatus: formData.stockStatus || "Not Updated",
//       status: undefined, // Remove to avoid schema conflicts
//     };
    
//     try {
//       if (editId) {
//         // Update existing PO
//         const response = await axios.put(`/api/purchase-order/${editId}`, payload, {
//           headers: { "Content-Type": "application/json" },
//         });
//         alert(response.data.message);
//       } else {
//         // Create new PO
//         const response = await axios.post("/api/purchase-order", payload, {
//           headers: { "Content-Type": "application/json" },
//         });
        
//         // Update PQ status if this was created from a quotation
//         if (formData.sourceQuotationId) {
//           try {
//             await axios.put(
//               `/api/purchase-quotation/${formData.sourceQuotationId}`,
//               { status: "ConvertedToOrder" }
//             );
//             console.log("PQ status updated to ConvertedToOrder");
//           } catch (err) {
//             console.error("Failed to update PQ status:", err);
//             alert("PO created successfully but failed to update quotation status");
//           }
//         }
        
//         alert(response.data.message);
//         setFormData(initialState);
//       }
      
//       // Clear session storage and redirect
//       sessionStorage.removeItem("purchaseOrderData");
//       router.push("/admin/purchase-order-view");
//     } catch (error) {
//       console.error("Error saving purchase order:", error);
//       alert(`Failed to ${editId ? "update" : "add"} purchase order: ${error.response?.data?.message || error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div className="p-8">Loading...</div>;
//   if (error) return <div className="p-8 text-red-600">{error}</div>;

//   return (
//     <div className="m-11 p-5 shadow-xl">
//       <h1 className="text-2xl font-bold mb-4">{editId ? "Edit Purchase Order" : "Create Purchase Order"}</h1>
//       <div className="flex flex-wrap justify-between m-10 p-5 border rounded-lg shadow-lg">
//         <div className="grid grid-cols-2 gap-7">
//           <div>
//             <label className="block mb-2 font-medium">Supplier Name</label>
//             {/* <SupplierSearch onSelectSupplier={handleSupplierSelect} /> */}

//             <SupplierSearch
//   onSelectSupplier={handleSupplierSelect}
//   // only pass when there really is a supplier
//   initialSupplier={
//     editId && formData.supplier
//       ? { _id: formData.supplier, supplierName: formData.supplierName }
//       : undefined
//   }
// />
//           </div>
//           <div>
//             <label className="block mb-2 font-medium">Supplier Code</label>
//             <input
//               type="text"
//               name="supplierCode"
//               value={formData.supplierCode || ""}
//               readOnly
//               className="w-full p-2 border rounded bg-gray-100"
//             />
//           </div>
//           <div>
//             <label className="block mb-2 font-medium">Contact Person</label>
//             <input
//               type="text"
//               name="contactPerson"
//               value={formData.contactPerson || ""}
//               readOnly
//               className="w-full p-2 border rounded bg-gray-100"
//             />
//           </div>
//           <div>
//             <label className="block mb-2 font-medium">Reference Number</label>
//             <input
//               type="text"
//               name="refNumber"
//               value={formData.refNumber || ""}
//               onChange={handleInputChange}
//               className="w-full p-2 border rounded"
//             />
//           </div>
//         </div>
//         <div className="w-full md:w-1/2 space-y-4">
//           <div>
//             <label className="block mb-2 font-medium">Order Status</label>
//             <select
//               name="orderStatus"
//               value={formData.orderStatus || ""}
//               onChange={handleInputChange}
//               className="w-full p-2 border rounded"
//             >
//               <option value="Open">Open</option>
//               <option value="Close">Close</option>
//               <option value="Cancelled">Cancelled</option>
//             </select>
//           </div>
//           <div>
//             <label className="block mb-2 font-medium">Posting Date</label>
//             <input
//               type="date"
//               name="postingDate"
//               value={formData.postingDate || ""}
//               onChange={handleInputChange}
//               className="w-full p-2 border rounded"
//             />
//           </div>
//           {/* <div>
//             <label className="block mb-2 font-medium">Valid Until</label>
//             <input
//               type="date"
//               name="validUntil"
//               value={formData.validUntil || ""}
//               onChange={handleInputChange}
//               className="w-full p-2 border rounded"
//             />
//           </div> */}
//           <div>
//             <label className="block mb-2 font-medium">Delivery Date</label>
//             <input
//               type="date"
//               name="documentDate"
//               value={formData.documentDate || ""}
//               onChange={handleInputChange}
//               className="w-full p-2 border rounded"
//             />
//           </div>
//         </div>
//       </div>
//       <h2 className="text-xl font-semibold mt-6">Items</h2>
//       <div className="flex flex-col m-10 p-5 border rounded-lg shadow-lg">
//         <ItemSection
//           items={formData.items}
//           onItemChange={handleItemChange}
//           onAddItem={addItemRow}
//           onRemoveItem={handleRemoveItem}
//           computeItemValues={computeItemValues}
//         />
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 m-8 border rounded-lg shadow-lg">
//         <div>
//           <label className="block mb-2 font-medium">Sales Employee</label>
//           <input
//             type="text"
//             name="salesEmployee"
//             value={formData.salesEmployee || ""}
//             onChange={handleInputChange}
//             className="w-full p-2 border rounded"
//           />
//         </div>
//         <div>
//           <label className="block mb-2 font-medium">Remarks</label>
//           <textarea
//             name="remarks"
//             value={formData.remarks || ""}
//             onChange={handleInputChange}
//             className="w-full p-2 border rounded"
//           ></textarea>
//         </div>
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 m-8 border rounded-lg shadow-lg">
//         <div>
//           <label className="block mb-2 font-medium">Taxable Amount</label>
//           <input
//             type="number"
//             name="totalBeforeDiscount"
//             value={formData.totalBeforeDiscount || 0}
//             readOnly
//             className="w-full p-2 border rounded bg-gray-100"
//           />
//         </div>
//         <div>
//           <label className="block mb-2 font-medium">Rounding</label>
//           <input
//             type="number"
//             name="rounding"
//             value={formData.rounding || 0}
//             onChange={handleInputChange}
//             className="w-full p-2 border rounded"
//           />
//         </div>
//         <div>
//           <label className="block mb-2 font-medium">GST</label>
//           <input
//             type="number"
//             name="gstTotal"
//             value={formData.gstTotal || 0}
//             readOnly
//             className="w-full p-2 border rounded bg-gray-100"
//           />
//         </div>
//         <div>
//           <label className="block mb-2 font-medium">Total Amount</label>
//           <input
//             type="number"
//             name="grandTotal"
//             value={formData.grandTotal || 0}
//             readOnly
//             className="w-full p-2 border rounded bg-gray-100"
//           />
//         </div>
//       </div>
//       <div className="flex flex-wrap gap-4 p-8 m-8 border rounded-lg shadow-lg">
//         <button
//           onClick={handleSubmit}
//           disabled={loading}
//           className={`px-4 py-2 rounded text-white ${
//             loading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-400 hover:bg-orange-300"
//           }`}
//         >
//           {loading ? "Saving..." : editId ? "Update" : "Add"}
//         </button>
//         <button
//           onClick={() => router.push("/admin/purchase-order-view")}
//           className="px-4 py-2 bg-orange-400 text-white rounded hover:bg-orange-300"
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   );
// }

// export default OrderFormWrapper;
