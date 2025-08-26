"use client";
import { useEffect, useState } from "react";

export default function SalesReport() {
  const [datewise, setDatewise] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Add state for filters
  const [selectedDate, setSelectedDate] = useState("2025-08-25"); // default today
  const [month, setMonth] = useState(8); // August
  const [year, setYear] = useState(2025);

  // ✅ Fetch reports whenever filters change
  useEffect(() => {
    fetchReports();
  }, [selectedDate, month, year]);

  const fetchReports = async () => {
    try {
      setLoading(true);

      const res1 = await fetch(`/api/reports/datewise?date=${selectedDate}`);
      const res2 = await fetch(`/api/reports/monthly?month=${month}&year=${year}`);

      const data1 = await res1.json();
      const data2 = await res2.json();

      setDatewise(data1.datewise || []);
      setMonthly(data2.monthly || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading reports...</div>;

  return (
    <div className="p-6 space-y-8">
      {/* Filter Controls */}
      <div className="flex space-x-4 mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <input
          type="number"
          value={month}
          min={1}
          max={12}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border px-2 py-1 rounded w-20"
        />
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border px-2 py-1 rounded w-28"
        />
      </div>

      {/* Datewise Report */}
      <div>
        <h2 className="text-xl font-bold mb-3">📅 Datewise Report</h2>
        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr className="bg-yellow-300 text-black">
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Zone</th>
              <th className="border px-2 py-1">Salesperson</th>
              <th className="border px-2 py-1">Total Qty (SQM)</th>
              <th className="border px-2 py-1">Order Value</th>
              <th className="border px-2 py-1">Dispatched</th>
              <th className="border px-2 py-1">Pending</th>
            </tr>
          </thead>
          <tbody>
            {datewise.map((row, i) => (
              <tr key={i} className="text-center">
                <td className="border px-2 py-1">{row._id.date}</td>
                <td className="border px-2 py-1">{row._id.zone}</td>
               <td className="border px-2 py-1">
  {row._id?.salesperson || "Unknown Salesperson"}
</td>
                <td className="border px-2 py-1">{row.totalQty}</td>
                <td className="border px-2 py-1">{row.totalValue}</td>
                <td className="border px-2 py-1">{row.totalDispatched}</td>
                <td className="border px-2 py-1">{row.totalPending}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Monthly Report */}
      <div>
        <h2 className="text-xl font-bold mb-3">📊 Cumulative of Month</h2>
        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr className="bg-green-300 text-black">
              <th className="border px-2 py-1">Zone</th>
              <th className="border px-2 py-1">Salesperson</th>
              <th className="border px-2 py-1">Total Qty (SQM)</th>
              <th className="border px-2 py-1">Order Value</th>
              <th className="border px-2 py-1">Dispatched till Date</th>
              <th className="border px-2 py-1">Pending till Date</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((row, i) => (
              <tr key={i} className="text-center">
                <td className="border px-2 py-1">{row._id.zone}</td>
                <td className="border px-2 py-1">{row._id.salesperson}</td>
                <td className="border px-2 py-1">{row.totalQty}</td>
                <td className="border px-2 py-1">{row.totalValue}</td>
                <td className="border px-2 py-1">{row.totalDispatched}</td>
                <td className="border px-2 py-1">{row.totalPending}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}







// 'use client';

// import React, { useEffect, useState } from 'react';
// import * as XLSX from 'xlsx';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
// } from 'recharts';

// export default function SalesReportPage() {
//   const [data, setData] = useState([]);

//   useEffect(() => {
//     fetch('/api/sales-invoice')
//       .then(res => res.json())
//       .then(json => {
//         if (Array.isArray(json)) {
//           setData(json);
//         } else if (Array.isArray(json.data)) {
//           setData(json.data);
//         } else {
//           console.error("API did not return an array:", json);
//           setData([]);
//         }
//       })
//       .catch(err => {
//         console.error("Fetch error:", err);
//         setData([]);
//       });
//   }, []);

//   const totalSales = Array.isArray(data)
//     ? data.reduce((acc, item) => acc + (item.grandTotal || 0), 0)
//     : 0;

//   const chartData = Array.isArray(data)
//     ? Object.values(
//         data.reduce((acc, curr) => {
//           const date = new Date(curr.orderDate).toLocaleDateString();
//           if (!acc[date]) {
//             acc[date] = { date, total: 0 };
//           }
//           acc[date].total += curr.grandTotal || 0;
//           return acc;
//         }, {})
//       )
//     : [];

//   const exportToExcel = () => {
//     const worksheet = XLSX.utils.json_to_sheet(
//       data.map(item => ({
//         Invoice: item.invoiceNumber,
//         Customer: item.customerName,
//         Date: new Date(item.orderDate).toLocaleDateString(),
//         Total: item.grandTotal,
//         Status: item.paymentStatus,
//       }))
//     );
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');
//     XLSX.writeFile(workbook, 'Sales_Report.xlsx');
//   };

//   const exportToPDF = () => {
//     const doc = new jsPDF();
//     doc.text('Sales Report', 14, 16);
//     const tableData = data.map(item => [
//       item.invoiceNumber,
//       item.customerName,
//       new Date(item.orderDate).toLocaleDateString(),
//       `₹${item.grandTotal}`,
//       item.paymentStatus,
//     ]);
//     autoTable(doc, {
//       startY: 20,
//       head: [['Invoice', 'Customer', 'Date', 'Amount', 'Status']],
//       body: tableData,
//     });
//     doc.save('Sales_Report.pdf');
//   };

//   return (
//     <div className="p-6">
//       <h1 className="text-3xl font-bold mb-6">Sales Report</h1>

//       {/* Chart Section */}
//       <div className="mb-6">
//         <h2 className="text-xl font-semibold mb-2">Overview Chart</h2>
//         <div className="bg-white shadow rounded p-4">
//           {chartData.length > 0 ? (
//             <ResponsiveContainer width="100%" height={300}>
//               <LineChart data={chartData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="date" />
//                 <YAxis />
//                 <Tooltip />
//                 <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} />
//               </LineChart>
//             </ResponsiveContainer>
//           ) : (
//             <p className="text-gray-500">No data to display</p>
//           )}
//         </div>
//       </div>

//       {/* Table Section */}
//       <div className="overflow-x-auto mb-4">
//         <h2 className="text-xl font-semibold mb-2">Invoice Table</h2>
//         <table className="min-w-full border border-gray-300">
//           <thead className="bg-gray-100 text-sm">
//             <tr>
//               <th className="px-4 py-2 border">Invoice No</th>
//               <th className="px-4 py-2 border">Customer</th>
//               <th className="px-4 py-2 border">Order Date</th>
//               <th className="px-4 py-2 border">Amount</th>
//               <th className="px-4 py-2 border">Status</th>
//             </tr>
//           </thead>
//           <tbody className="text-center text-sm">
//             {data.map(inv => (
//               <tr key={inv.invoiceNumber} className="border-t">
//                 <td className="px-4 py-2 border">{inv.invoiceNumber}</td>
//                 <td className="px-4 py-2 border">{inv.customerName}</td>
//                 <td className="px-4 py-2 border">{new Date(inv.orderDate).toLocaleDateString()}</td>
//                 <td className="px-4 py-2 border">₹{inv.grandTotal}</td>
//                 <td className="px-4 py-2 border">{inv.paymentStatus}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Export Buttons */}
//       <div className="flex gap-4 mt-4">
//         <button
//           onClick={exportToExcel}
//           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
//         >
//           Export Excel
//         </button>
//         <button
//           onClick={exportToPDF}
//           className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
//         >
//           Export PDF
//         </button>
//       </div>

//       {/* Total */}
//       <div className="mt-6 text-right font-bold text-lg">
//         Total Sales: ₹{totalSales}
//       </div>
//     </div>
//   );
// }
