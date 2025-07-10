"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import MultiBatchModal from "@/components/MultiBatchModalbtach";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function StockTransferPage() {
  const { orderId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const qtyParam = Number(searchParams.get("qty")) || 1;

  const [order, setOrder] = useState(null);
  const [rows, setRows] = useState([]);
  const [docNo, setDocNo] = useState("");
  const [docDate, setDocDate] = useState("");
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [sourceWarehouse, setSourceWarehouse] = useState("");
  const [batchModalIndex, setBatchModalIndex] = useState(null);
  const [batchOptions, setBatchOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/warehouse")
      .then((r) => setWarehouseOptions(r.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const { data: ord } = await axios.get(`/api/production-orders/${orderId}`);
        setOrder(ord);

        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        setDocNo(`ST-${today}-${orderId.slice(-4)}`);
        setDocDate(new Date().toISOString().slice(0, 10));

        const sw = ord.warehouse?._id || ord.warehouse || "";
        setSourceWarehouse(sw);

        const rowsWithBatchFlag = await Promise.all(
          ord.items.map(async (item) => {
            const itemId = item.item?._id || item.item || "";
            let managedByBatch = false;

            try {
              const { data } = await axios.get(`/api/items/${itemId}`);
              console.log("Fetched item:", data?.data);
              managedByBatch = (data?.data?.managedBy || "").toLowerCase() === "batch";
            } catch (err) {
              console.warn(`Error fetching item ${itemId}:`, err);
            }

            return {
              itemId,
              itemCode: item.itemCode,
              itemName: item.itemName,
              uom: item.unitQty > 1 ? `x${item.unitQty}` : "pcs",
              qty: qtyParam * item.quantity,
              batches: [],
              batchNumber: "",
              sourceWarehouse: sw,
              destination: item.warehouse?._id || item.warehouse || "",
              managedByBatch,
            };
          })
        );

        console.log("Prepared rows:", rowsWithBatchFlag);
        setRows(rowsWithBatchFlag);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, qtyParam]);

  useEffect(() => {
    if (batchModalIndex == null) return;
    const row = rows[batchModalIndex];
    if (!row || !row.itemId || !row.sourceWarehouse) return;

    axios
      .get(`/api/inventory-batch/${row.itemId}/${row.sourceWarehouse}`)
      .then((r) => setBatchOptions(r.data.batches || []))
      .catch((err) => {
        if (err.response?.status === 404) {
          setBatchOptions([]);
        } else {
          console.error(err);
        }
      });
  }, [batchModalIndex, rows]);

  const openBatchModal = useCallback((idx) => setBatchModalIndex(idx), []);
  const closeBatchModal = useCallback(() => setBatchModalIndex(null), []);

  const handleUpdateBatch = (updatedBatch) => {
    if (batchModalIndex == null || !rows[batchModalIndex]) return;

    setRows((prevRows) => {
      const updated = [...prevRows];
      updated[batchModalIndex] = {
        ...updated[batchModalIndex],
        batches: updatedBatch,
        batchNumber: updatedBatch.map((b) => b.batchNumber).join(", "),
      };
      return updated;
    });

    closeBatchModal();
  };

  const handleQtyChange = (index, newQty) => {
    const updatedRows = [...rows];
    updatedRows[index].qty = parseFloat(newQty) || 0;
    setRows(updatedRows);
  };

 const handleSubmit = useCallback(
  async (e) => {
    e.preventDefault();
    const dataToSend = [];

    for (const row of rows) {
      if (row.managedByBatch) {
        if (!row.batches || row.batches.length === 0) {
          toast.error(`Please select batches for item ${row.itemCode}`);
          return;
        }

        for (const batch of row.batches) {
          if (!batch.batchNumber || !batch.quantity || batch.quantity <= 0) {
            toast.error(`Invalid batch quantity or batch number for item ${row.itemCode}`);
            return;
          }

          dataToSend.push({
            productionOrderId: order._id,
            qtyParam,
            itemId: row.itemId,
            sourceWarehouse: row.sourceWarehouse,
            destinationWarehouse: row.destination,
            batchNumber: batch.batchNumber,
            quantity: batch.quantity,
            expiryDate: batch.expiryDate || null,
            manufacturer: batch.manufacturer || null,
            unitPrice: batch.unitPrice || null,
          });
        }
      } else {
        if (!row.qty || row.qty <= 0) {
          toast.error(`Please enter quantity for item ${row.itemCode}`);
          return;
        }

        dataToSend.push({
          productionOrderId: order._id,
          qtyParam,
          itemId: row.itemId,
          sourceWarehouse: row.sourceWarehouse,
          destinationWarehouse: row.destination,
          quantity: row.qty,
          batchNumber: null,
          expiryDate: null,
          manufacturer: null,
          unitPrice: null,
        });
      }
    }

    try {
      const response = await axios.post(
        `/api/stock-transfer/${order._id}?qty=${qtyParam}`,
        dataToSend
      );
      toast.success(response.data.message || "Stock transfer successful");
      router.push("/admin/productionorders-list-view");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to transfer stock");
    }
  },
  [rows, router, order, qtyParam]
);


  if (loading) return <p>Loading…</p>;
  if (!order) return <p>Order not found</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow rounded">
      <ToastContainer />
      <h1 className="text-2xl font-semibold mb-6">Stock  Transfer</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label>Document No</label>
            <input readOnly value={docNo} className="w-full border p-2 bg-gray-100 rounded" />
          </div>
          <div>
            <label>Date</label>
            <input
              type="date"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label>Source Warehouse</label>
            <select
              value={sourceWarehouse}
              onChange={(e) => setSourceWarehouse(e.target.value)}
              required
              className="w-full border p-2 rounded"
            >
              <option value="">-- select --</option>
              {warehouseOptions.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.warehouseName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <table className="w-full text-sm border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Item Code</th>
              <th className="border p-2">Item Name</th>
              <th className="border p-2">Qty</th>
              <th className="border p-2">Batch</th>
              <th className="border p-2">Source</th>
              <th className="border p-2">Dest</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border p-1">{r.itemCode}</td>
                <td className="border p-1">{r.itemName}</td>
                <td className="border p-1">
                  <input
                    type="number"
                    value={r.qty}
                    onChange={(e) => handleQtyChange(i, e.target.value)}
                    className="w-full px-1 border border-gray-300 rounded"
                  />
                </td>
                <td className="border p-1">
                  {r.managedByBatch ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openBatchModal(i)}
                        className="px-2 py-1 bg-blue-600 text-white rounded"
                      >
                        {r.batchNumber || "Select Batches"}
                      </button>
                      {r.batches?.length > 0 && (
                        <ul className="mt-1 text-xs">
                          {r.batches.map((b, idx) => (
                            <li key={idx}>
                              Batch: <strong>{b.batchNumber}</strong>, Qty:{" "}
                              <strong>{b.quantity}</strong>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500 italic">Not batch-managed</span>
                  )}
                </td>
                <td className="border p-1">
                  <select
                    className="w-full border p-1 rounded"
                    value={r.sourceWarehouse}
                    onChange={(e) => {
                      const newSrc = e.target.value;
                      setRows((prev) => {
                        const copy = [...prev];
                        copy[i] = { ...copy[i], sourceWarehouse: newSrc };
                        return copy;
                      });
                    }}
                  >
                    <option value="">-- select --</option>
                    {warehouseOptions.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.warehouseName}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border p-1">
                  <select
                    className="w-full border p-1 rounded"
                    value={r.destination}
                    onChange={(e) => {
                      const newDest = e.target.value;
                      setRows((prev) => {
                        const copy = [...prev];
                        copy[i] = { ...copy[i], destination: newDest };
                        return copy;
                      });
                    }}
                  >
                    <option value="">-- select --</option>
                    {warehouseOptions.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.warehouseName}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          type="submit"
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Submit Transfer
        </button>
      </form>

      {batchModalIndex != null && rows[batchModalIndex] && (
        <MultiBatchModal
          itemsbatch={rows[batchModalIndex]}
          batchOptions={batchOptions}
          onClose={closeBatchModal}
          onUpdateBatch={handleUpdateBatch}
        />
      )}
    </div>
  );
}







// without batch management
// "use client";

// import React, { useState, useEffect, useCallback } from "react";
// import { useParams, useSearchParams, useRouter } from "next/navigation";
// import axios from "axios";
// import MultiBatchModal from "@/components/MultiBatchModalbtach";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// export default function StockTransferPage() {
//   const { orderId } = useParams();
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const qtyParam = Number(searchParams.get("qty")) || 1;

//   const [order, setOrder] = useState(null);
//   const [rows, setRows] = useState([]);
//   const [docNo, setDocNo] = useState("");
//   const [docDate, setDocDate] = useState("");
//   const [warehouseOptions, setWarehouseOptions] = useState([]);
//   const [sourceWarehouse, setSourceWarehouse] = useState("");
//   const [batchModalIndex, setBatchModalIndex] = useState(null);
//   const [batchOptions, setBatchOptions] = useState([]);
//   const [loading, setLoading] = useState(true);
  
//   // Fetch warehouse options
//   useEffect(() => {
//     axios
//       .get("/api/warehouse")
//       .then((r) => setWarehouseOptions(r.data))
//       .catch(console.error);
//   }, []);

//   // Fetch order and initialize form
//   useEffect(() => {
//     if (!orderId) return;
//     (async () => {
//       try {
//         const { data: ord } = await axios.get(
//           `/api/production-orders/${orderId}`
//         );
//         setOrder(ord);
//         const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
//         setDocNo(`ST-${today}-${orderId.slice(-4)}`);
//         setDocDate(new Date().toISOString().slice(0, 10));
//         const sw = ord.warehouse?._id || ord.warehouse || "";
//         setSourceWarehouse(sw);
//         setRows(
//           ord.items.map((item) => ({
//             itemId: item.item?._id || item.item || "",
//             itemCode: item.itemCode,
//             itemName: item.itemName,
//             uom: item.unitQty > 1 ? `x${item.unitQty}` : "pcs",
//             qty: qtyParam * item.quantity,
//             batches: [],
//             batchNumber: "",
//             sourceWarehouse: ord.warehouse?._id || ord.warehouse || "",
//             destination: item.warehouse?._id || item.warehouse || "",
//             managedByBatch: item.managedBy === "batch",
//           }))
//         );
//       } catch (e) {
//         console.error(e);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [orderId, qtyParam]);

//   // Load batches when modal opens
// useEffect(() => {
//   if (batchModalIndex == null) return;

//   const row = rows[batchModalIndex];
//   if (!row) return;

//   const { itemId, sourceWarehouse: wh } = row;
//   if (!itemId || !wh) return;

//   axios
//     .get(`/api/inventory-batch/${itemId}/${wh}`)
//     .then((r) => setBatchOptions(r.data.batches || []))
//     .catch((err) => {
//       if (err.response?.status === 404) {
//         setBatchOptions([]);  // no batches found, set empty list
//       } else {
//         console.error(err);
//       }
//     });
// }, [batchModalIndex, rows]);


// const openBatchModal = useCallback((idx) => {
//   console.log("Opening batch modal for index:", idx);
//   setBatchModalIndex(idx);
// }, []);
//   const closeBatchModal = useCallback(() => setBatchModalIndex(null), []);

// const handleUpdateBatch = (updatedBatch) => {
//   if (batchModalIndex == null || !rows[batchModalIndex]) {
//     console.warn("Invalid batch index or data", {
//       batchModalIndex,
//       updatedBatch,
//       rows,
//     });
//     return;
//   }

//   setRows((prevRows) => {
//     const updated = [...prevRows];
//     updated[batchModalIndex] = {
//       ...updated[batchModalIndex],
//       batches: updatedBatch,
//       batchNo: updatedBatch.map((b) => b.batchNo).join(", "),
//     };
//     return updated;
//   });

//   closeBatchModal();
// };

// const handleQtyChange = (index, newQty) => {
//   const updatedRows = [...rows];
//   updatedRows[index].qty = parseFloat(newQty) || 0;
//   setRows(updatedRows);
// };


// const handleSubmit = useCallback(
//   async (e) => {
//     e.preventDefault();

//     const dataToSend = [];

//     for (const row of rows) {
//       if (!row.batches || row.batches.length === 0) {
//         toast.error(`Please select batches for item ${row.itemCode}`);
//         return;
//       }

//       for (const batch of row.batches) {
//         if (!batch.batchNumber || !batch.quantity || batch.quantity <= 0) {
//           toast.error(
//             `Invalid batch quantity or batch number for item ${row.itemCode}`
//           );
//           return;
//         }

//         dataToSend.push({
//           productionOrderId: order._id,
//           qtyParam: qtyParam,
//           itemId: row.itemId,
//           sourceWarehouse: row.sourceWarehouse,
//           destinationWarehouse: row.destination,
//           batchNumber: batch.batchNumber,
//           quantity: batch.quantity,
//           expiryDate: batch.expiryDate || null,
//           manufacturer: batch.manufacturer || null,
//           unitPrice: batch.unitPrice || null,
//         });
//       }
//     }

//     try {
//       const response = await axios.post(
//         `/api/stock-transfer/${order._id}?qty=${qtyParam}`,
//         dataToSend
//       );

//       toast.success(response.data.message || "Stock transfer successful");
//       // router.push("/some-success-page");
//     } catch (error) {
//       console.error(error);
//       const message =
//         error.response?.data?.message || "Failed to transfer stock";
//       toast.error(message);
//     }
//   },
//   [rows, router, order, qtyParam]
// );


//   if (loading) return <p>Loading…</p>;
//   if (!order) return <p>Order not found</p>;

//   return (
//     <div className="max-w-6xl mx-auto p-6 bg-white shadow rounded">
//       <ToastContainer />
//       <h1 className="text-2xl font-semibold mb-6">Stock Transfer</h1>
//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Header */}
//         <div className="grid grid-cols-3 gap-4">
//           <div>
//             <label>Document No</label>
//             <input
//               readOnly
//               value={docNo}
//               className="w-full border p-2 bg-gray-100 rounded"
//             />
//           </div>
//           <div>
//             <label>Date</label>
//             <input
//               type="date"
//               value={docDate}
//               onChange={(e) => setDocDate(e.target.value)}
//               className="w-full border p-2 rounded"
//             />
//           </div>
//           <div>
//             <label>Source Warehouse</label>
//             <select
//               value={sourceWarehouse}
//               onChange={(e) => setSourceWarehouse(e.target.value)}
//               required
//               className="w-full border p-2 rounded"
//             >
//               <option value="">-- select --</option>
//               {warehouseOptions.map((w) => (
//                 <option key={w._id} value={w._id}>
//                   {w.warehouseName}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         {/* Items Table */}
//         <table className="w-full text-sm border border-gray-300">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="border p-2">Item Code</th>
//               <th className="border p-2">Item Name</th>
//               <th className="border p-2">Qty</th>
//               <th className="border p-2">Batch</th>
//               <th className="border p-2">Source</th>
//               <th className="border p-2">Dest</th>
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((r, i) => (
//               <tr key={i} className="hover:bg-gray-50">
//                 <td className="border p-1">{r.itemCode}</td>
//                 <td className="border p-1">{r.itemName}</td>
//                   <td className="border p-1">
//       <input
//         type="number"
//         value={r.qty}
//         onChange={(e) => handleQtyChange(i, e.target.value)}
//         className="w-full px-1 border border-gray-300 rounded"
//       />
//     </td>
//                 <td className="border p-1">
//                   <button
//                     type="button"
//                     onClick={() => openBatchModal(i)}
//                     className="px-2 py-1 bg-blue-600 text-white rounded"
//                   >
//                     {r.batchNumber || "Select Batches"}
//                   </button>
//                   {r.batches?.length > 0 && (
//                     <ul className="mt-1 text-xs">
//                       {r.batches.map((b, idx) => (
//                         <li key={idx}>
//                           Batch: <strong>{b.batchNumber}</strong>, Qty:{" "}
//                           <strong>{b.quantity}</strong>
//                         </li>
//                       ))}
//                     </ul>
//                   )}
//                 </td>
//                 <td className="border p-1">
//                   <select
//                     className="w-full border p-1 rounded"
//                     value={r.sourceWarehouse}
//                     onChange={(e) => {
//                       const newSrc = e.target.value;
//                       setRows((prev) => {
//                         const copy = [...prev];
//                         copy[i] = { ...copy[i], sourceWarehouse: newSrc };
//                         return copy;
//                       });
//                     }}
//                   >
//                     <option value="">-- select --</option>
//                     {warehouseOptions.map((w) => (
//                       <option key={w._id} value={w._id}>
//                         {w.warehouseName}
//                       </option>
//                     ))}
//                   </select>
//                 </td>
//                 <td className="border p-1">
//                   <select
//                     className="w-full border p-1 rounded"
//                     value={r.destination}
//                     onChange={(e) => {
//                       const newDest = e.target.value;
//                       setRows((prev) => {
//                         const copy = [...prev];
//                         copy[i] = { ...copy[i], destination: newDest };
//                         return copy;
//                       });
//                     }}
//                   >
//                     <option value="">-- select --</option>
//                     {warehouseOptions.map((w) => (
//                       <option key={w._id} value={w._id}>
//                         {w.warehouseName}
//                       </option>
//                     ))}
//                   </select>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         <button
//           type="submit"
//           className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
//         >
//           Submit Transfer
//         </button>
//       </form>

//       {batchModalIndex != null && rows[batchModalIndex] && (
//   <>
//     <p>Modal open for row: {batchModalIndex}</p>
//     <MultiBatchModal
//       itemsbatch={rows[batchModalIndex]}
//       batchOptions={batchOptions}
//       onClose={closeBatchModal}
//       onUpdateBatch={handleUpdateBatch}
//     />
//   </>
// )}


//     </div>
//   );
// }
