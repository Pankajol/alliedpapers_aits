"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { FaSpinner } from "react-icons/fa";

export default function PurchaseQuotationView() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios
      .get(`/api/purchase-quotation/${id}`)
      .then((res) => {
        if (res.data.success) {
          setQuotation(res.data.data);
          setError(null);
        } else {
          setError(res.data.error || "Quotation not found.");
        }
      })
      .catch((err) => {
        console.error("Error fetching quotation:", err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString() : "-";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center text-red-600">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p>No quotation data available.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-4xl font-bold text-center">Purchase Quotation Details</h1>
      
      {/* Basic Info Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Supplier Information</h2>
            <div className="space-y-2">
              <p className="text-lg">
                <span className="font-bold">Supplier Code:</span> {quotation.supplierCode || "-"}
              </p>
              <p className="text-lg">
                <span className="font-bold">Supplier Name:</span> {quotation.supplierName}
              </p>
              <p className="text-lg">
                <span className="font-bold">Contact Person:</span> {quotation.contactPerson || "-"}
              </p>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Quotation Information</h2>
            <div className="space-y-2">
              <p className="text-lg">
                <span className="font-bold">Reference Number:</span> {quotation.refNumber}
              </p>
              <p className="text-lg">
                <span className="font-bold">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  quotation.status === "Open" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {quotation.status}
                </span>
              </p>
              <p className="text-lg">
                <span className="font-bold">Invoice Type:</span> {quotation.invoiceType}
              </p>
              <p className="text-lg">
                <span className="font-bold">Posting Date:</span> {formatDate(quotation.postingDate)}
              </p>
              <p className="text-lg">
                <span className="font-bold">Valid Until:</span> {formatDate(quotation.validUntil)}
              </p>
              <p className="text-lg">
                <span className="font-bold">Document Date:</span> {formatDate(quotation.documentDate)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Sales Employee and Remarks */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-lg">
                <span className="font-bold">Sales Employee:</span> {quotation.salesEmployee || "-"}
              </p>
            </div>
            <div>
              {quotation.remarks && (
                <div>
                  <p className="font-bold text-lg">Remarks:</p>
                  <p className="text-gray-700">{quotation.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Items</h2>
        {quotation.items && quotation.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotation.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{item.itemCode || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.itemName || "N/A"}</td>
                    <td className="px-6 py-4">{item.itemDescription || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.warehouseCode ? `${item.warehouseCode} - ${item.warehouseName}` : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>Ordered: {item.quantity}</span>
                        {item.orderedQuantity > 0 && (
                          <span className="text-sm text-green-600">Ordered: {item.orderedQuantity}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(item.discount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{item.taxOption}: {item.gstRate}%</span>
                        <span>{formatCurrency(item.gstAmount)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{formatCurrency(item.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">No items found.</p>
        )}
      </div>

      {/* Financial Summary */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Financial Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Total Before Discount:</span>
              <span>{formatCurrency(quotation.totalBeforeDiscount)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Freight:</span>
              <span>{formatCurrency(quotation.freight)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Rounding:</span>
              <span>{formatCurrency(quotation.rounding)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Total Down Payment:</span>
              <span>{formatCurrency(quotation.totalDownPayment)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Applied Amounts:</span>
              <span>{formatCurrency(quotation.appliedAmounts)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">GST Total:</span>
              <span>{formatCurrency(quotation.gstTotal)}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between">
            <div>
              <p className="text-lg font-semibold">Open Balance:</p>
              <p className="text-xl">{formatCurrency(quotation.openBalance)}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">Grand Total:</p>
              <p className="text-2xl font-bold">{formatCurrency(quotation.grandTotal)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { useState, useEffect } from "react";
// import { useParams } from "next/navigation";
// import axios from "axios";
// import { FaSpinner } from "react-icons/fa";

// export default function PurchaseQuotationView() {
//   const { id } = useParams();
//   const [quotation, setQuotation] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!id) return;
//     setLoading(true);
//     axios
//       .get(`/api/purchase-quotation/${id}`)
//       .then((res) => {
//         if (res.data.success) {
//           setQuotation(res.data.data);
//           setError(null);
//         } else {
//           setError(res.data.error || "Quotation not found.");
//         }
//       })
//       .catch((err) => {
//         console.error("Error fetching quotation:", err);
//         setError(err.message);
//       })
//       .finally(() => {
//         setLoading(false);
//       });
//   }, [id]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <FaSpinner className="animate-spin text-4xl text-gray-500" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="container mx-auto p-6 text-center text-red-600">
//         <h2 className="text-2xl font-bold mb-4">Error</h2>
//         <p>{error}</p>
//       </div>
//     );
//   }

//   if (!quotation) {
//     return (
//       <div className="container mx-auto p-6 text-center">
//         <p>No quotation data available.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto p-6 space-y-6">
//       <h1 className="text-4xl font-bold text-center">Purchase Quotation Details</h1>
      
//       {/* Basic Info Section */}
//       <div className="bg-white shadow-md rounded p-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <p className="text-lg">
//               <span className="font-bold">Reference Number:</span> {quotation.refNumber}
//             </p>
//             <p className="text-lg">
//               <span className="font-bold">Supplier Name:</span> {quotation.supplierName}
//             </p>
//             <p className="text-lg">
//               <span className="font-bold">Status:</span> {quotation.status}
//             </p>
//           </div>
//           <div>
//             <p className="text-lg">
//               <span className="font-bold">Posting Date:</span>{" "}
//               {quotation.postingDate ? new Date(quotation.postingDate).toLocaleDateString() : "-"}
//             </p>
//             <p className="text-lg">
//               <span className="font-bold">Valid Until:</span>{" "}
//               {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : "-"}
//             </p>
//             <p className="text-lg">
//               <span className="font-bold">Delivery Date:</span>{" "}
//               {quotation.documentDate ? new Date(quotation.documentDate).toLocaleDateString() : "-"}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Items Section */}
//       <div className="bg-white shadow-md rounded p-6">
//         <h2 className="text-2xl font-semibold mb-4">Items</h2>
//         {quotation.items && quotation.items.length > 0 ? (
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {quotation.items.map((item, index) => (
//                   <tr key={index}>
//                     <td className="px-6 py-4 whitespace-nowrap">{item.itemDescription || "N/A"}</td>
//                     <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
//                     <td className="px-6 py-4 whitespace-nowrap">{item.unitPrice}</td>
//                     <td className="px-6 py-4 whitespace-nowrap">{item.totalAmount}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <p className="text-center text-gray-500">No items found.</p>
//         )}
//       </div>
//     </div>
//   );
// }
