import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import dbConnect from '@/lib/db';
import SalesOrder from '@/models/SalesOrder';
import { getTokenFromHeader, verifyJWT } from '@/lib/auth';
import { sendSalesOrderEmail } from "@/lib/mailer";
import { parseForm } from '@/lib/formParser';

export const config = {
  api: {
    bodyParser: false, // needed for formidable
  },
};

const { Types } = mongoose;

function isAuthorized(user) {
  if (user.type === 'company') return true;
  if (user.role === 'Sales Manager' || user.role === 'Admin') return true;
  return user.permissions?.includes('sales');
}

export async function POST(req) {
  await dbConnect();

  try {
    // 1. Auth
    const token = getTokenFromHeader(req);
    const user = await verifyJWT(token);
    if (!user || !isAuthorized(user)) throw new Error("Forbidden");

    // 2. Parse form (with JSON + files)
    const { fields, files } = await parseForm(req);

    // 3. Parse JSON body (orderData)
    const orderData = JSON.parse(fields.orderData);

    delete orderData._id;
    orderData.items?.forEach(i => delete i._id);
    delete orderData.billingAddress?._id;
    delete orderData.shippingAddress?._id;

    // 4. Inject metadata
    orderData.companyId = user.companyId;
    if (user.type === "user") orderData.createdBy = user.id;

    // 5. Add uploaded files
    const fileArray = Array.isArray(files.attachments) ? files.attachments : [files.attachments];
    orderData.attachments = fileArray
      .filter(Boolean)
      .map(file => ({
        fileName: file.originalFilename,
        fileUrl: `/uploads/${path.basename(file.filepath)}`,
        fileType: file.mimetype,
        uploadedAt: new Date(),
      }));

    // 6. Save order
    const order = await SalesOrder.create(orderData);

    // 7. Email confirmation
    await sendSalesOrderEmail(
      ["aniketgaikwad7224@gmail.com", "9to5withnikhil@gmail.com", "cp5553135@gmail.com", "pritammore1001@gmail.com"],
      order
    );

    return NextResponse.json(
      { success: true, message: "Sales order created", orderId: order._id },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, {
      status: /Forbidden|Unauthorized/.test(err.message) ? 401 : 500
    });
  }
}



// // app/api/sales-orders/route.js
// import { NextResponse } from 'next/server';
// import mongoose from 'mongoose';
// import dbConnect from '@/lib/db';
// import SalesOrder from '@/models/SalesOrder';
// import Inventory from '@/models/Inventory';
// import StockMovement from '@/models/StockMovement';
// import { getTokenFromHeader, verifyJWT } from '@/lib/auth';
// import { sendSalesOrderEmail } from "@/lib/mailer";

// const { Types } = mongoose;

// /* -------------------------------------------------
//    Helper: only company token OR user w/ "sales" perm
// -------------------------------------------------- */
// // function isAuthorized(user) {
// //   return user.type === 'company' || user.permissions?.includes('sales');
// // }
// function isAuthorized(user) {
//   if (user.type === 'company') return true;
//   if (user.role === 'Sales Manager' || user.role === 'Admin') return true;
//   return user.permissions?.includes('sales');
// }

// /* =================================================
//    POST  /api/sales-orders   (create + reserve stock)
// =================================================== */
// export async function POST(req) {
//   await dbConnect();

//   try {
//     const token = getTokenFromHeader(req);
//     const user  = await verifyJWT(token);
//     if (!user || !isAuthorized(user)) throw new Error("Forbidden");

//     const orderData = await req.json();
//     ["_id", "billingAddress?._id", "shippingAddress?._id"].forEach(k => delete orderData[k]);
//     orderData.items?.forEach(i => delete i._id);

//     orderData.companyId = user.companyId;
//     if (user.type === "user") orderData.createdBy = user.id;

//     const order = await SalesOrder.create(orderData);

//     await sendSalesOrderEmail(
//       ["aniketgaikwad7224@gmail.com","9to5withnikhil@gmail.com","cp5553135@gmail.com","pritammore1001@gmail.com"],
//       order
//     );

//     return NextResponse.json(
//       { success: true, message: "Sales order created", orderId: order._id },
//       { status: 201 }
//     );
//   } catch (err) {
//     const code = /Forbidden|Unauthorized/.test(err.message) ? 401 : 500;
//     return NextResponse.json({ success: false, message: err.message }, { status: code });
//   }
// }


/* =================================================
   GET  /api/sales-orders   (list orders by company)
=================================================== */
export async function GET(req) {
  await dbConnect();

  try {
    const token = getTokenFromHeader(req);
    const user  = await verifyJWT(token);

    /* allow company token OR user with Admin / Sales Manager role */
    if (!user || (user.type === 'user' && !['Admin', 'Sales Manager'].includes(user.role))) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const salesOrders = await SalesOrder.find({ companyId: user.companyId });
    return NextResponse.json({ success: true, data: salesOrders }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}



