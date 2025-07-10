"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ProductionOrderView() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/production-orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(console.error);
  }, [id]);

  if (!order) return <p>Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-semibold mb-4">Production Order Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* <div><strong>Order ID:</strong> {order._id}</div> */}
        <div><strong>productNo:</strong> {order.bomId?.productNo}</div>
        <div><strong>Type:</strong> {order.type}</div>
        <div><strong>Status:</strong> {order.status}</div>
        <div><strong>Warehouse:</strong> {order.warehouse?.warehouseName}</div>
        <div><strong>Product Description:</strong> {order.productDesc}</div>
        <div><strong>Priority:</strong> {order.priority}</div>
        <div><strong>Quantity:</strong> {order.quantity}</div>
        <div><strong>Production Date:</strong> {new Date(order.productionDate).toLocaleDateString()}</div>
      </div>
      <h3 className="text-xl font-semibold mb-2">Items</h3>
      <table className="w-full table-auto border-collapse border text-sm mb-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Item Code</th>
            <th className="border p-2">Item Name</th>
            <th className="border p-2">Unit Qty</th>
            <th className="border p-2">Qty</th>
            <th className="border p-2">Req. Qty</th>
            <th className="border p-2">Warehouse</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="border p-2">{item.itemCode}</td>
              <td className="border p-2">{item.itemName}</td>
              <td className="border p-2 text-right">{item.unitQty}</td>
              <td className="border p-2 text-right">{item.quantity}</td>
              <td className="border p-2 text-right">{item.requiredQty}</td>
              <td className="border p-2">{item.warehouse?.warehouseName}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <a href={`/admin/productionorderdetail-view/edit/${id}`}>
        <span className="text-blue-600 hover:underline">Edit Order</span>
      </a>
    </div>
  );
}
