import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import formidable from "formidable";
import { Readable } from "stream";

import dbConnect from "@/lib/db";
import SalesOrder from "@/models/SalesOrder";
import { getTokenFromHeader, verifyJWT } from "@/lib/auth";
import { sendStageChangeEmail } from "@/lib/stageEmail";

// ─── Next.js App‑router config ──────────────────────────────────────────────
export const config = { api: { bodyParser: false } };

// ─── helpers ────────────────────────────────────────────────────────────────
function isAuthorized(user) {
  if (user.type === "company") return true;
  if (user.role === "Admin") return true;
  if (user.role === "Sales Manager") return true; // limited
  return user.permissions?.includes("sales");
}

async function toNodeReq(request) {
  const buf = Buffer.from(await request.arrayBuffer());
  const nodeReq = new Readable({
    read() {
      this.push(buf);
      this.push(null);
    },
  });
  nodeReq.headers = Object.fromEntries(request.headers.entries());
  nodeReq.method = request.method;
  nodeReq.url = request.url || "/";
  return nodeReq;
}

async function parseMultipart(request) {
  const nodeReq = await toNodeReq(request);
  const form = formidable({ multiples: true, keepExtensions: true });
  return await new Promise((res, rej) =>
    form.parse(nodeReq, (err, fields, files) =>
      err ? rej(err) : res({ fields, files })
    )
  );
}

// ─── GET Handler ────────────────────────────────────────────────────────────
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const order = await SalesOrder.findById(id);
    if (!order)
      return NextResponse.json({ message: "Sales Order not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: order });
  } catch (err) {
    console.error("GET error:", err);
    return NextResponse.json(
      { message: "Error fetching Sales Order", error: err.message },
      { status: 500 }
    );
  }
}

// ─── PUT Handler ────────────────────────────────────────────────────────────
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const user = await verifyJWT(getTokenFromHeader(req));
    if (!user || !isAuthorized(user))
      return NextResponse.json({ message: "Forbidden" }, { status: 401 });

    const current = await SalesOrder.findById(id);
    if (!current)
      return NextResponse.json({ message: "Sales Order not found" }, { status: 404 });

    const cType = req.headers.get("content-type") || "";
    let body = {};
    let newFiles = [];
    let removedFiles = [];

    if (cType.includes("multipart/form-data")) {
      const { fields, files } = await parseMultipart(req);
      body = JSON.parse(fields.orderData || "{}");
      removedFiles = JSON.parse(fields.removedFiles || "[]");
      newFiles = Array.isArray(files.newFiles)
        ? files.newFiles
        : files.newFiles
        ? [files.newFiles]
        : [];
    } else {
      body = await req.json();
    }

    const limited = user.role === "Sales Manager" && user.type !== "company";
    if (limited) body = { status: body.status, statusStages: body.statusStages };

    if (body.billingAddress && typeof body.billingAddress === "object")
      delete body.billingAddress._id;
    if (body.shippingAddress && typeof body.shippingAddress === "object")
      delete body.shippingAddress._id;

    const { attachments: _omit, ...scalar } = body;
    const updateDoc = { $set: scalar };

    if (!limited) {
      // Removed files
      if (removedFiles.length) {
        updateDoc.$pull = {
          attachments: { fileUrl: { $in: removedFiles.map((f) => f.fileUrl) } },
        };
        await Promise.all(
          removedFiles.map(async (f) => {
            const p = path.join(process.cwd(), "public", f.fileUrl);
            try {
              await fs.unlink(p);
            } catch {}
          })
        );
      }

      // Add new files — with extension handling
      if (newFiles.length) {
        const uploadDir = path.join(process.cwd(), "public/uploads");
        await fs.mkdir(uploadDir, { recursive: true });

        const uploads = await Promise.all(
          newFiles.map(async (f) => {
            const ext = path.extname(f.originalFilename);
            const newName = `${path.basename(f.filepath)}${ext}`;
            const newPath = path.join(uploadDir, newName);
            await fs.rename(f.filepath, newPath);

            return {
              fileName: f.originalFilename,
              fileUrl: `/uploads/${newName}`,
              fileType: f.mimetype,
              uploadedAt: new Date(),
            };
          })
        );

        updateDoc.$push = { attachments: { $each: uploads } };
      }
    }

    const updated = await SalesOrder.findByIdAndUpdate(id, updateDoc, {
      new: true,
      runValidators: true,
    });

    await sendStageChangeEmail(updated, current.statusStages);

    return NextResponse.json(
      { message: "Sales Order updated", data: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("PUT error:", err);
    return NextResponse.json(
      { message: "Error updating Sales Order", error: err.message },
      { status: 500 }
    );
  }
}

// ─── DELETE Handler ─────────────────────────────────────────────────────────
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const user = await verifyJWT(getTokenFromHeader(req));
    if (!user || (user.role !== "Admin" && user.type !== "company"))
      return NextResponse.json({ message: "Forbidden" }, { status: 401 });

    const order = await SalesOrder.findByIdAndDelete(id);
    if (!order)
      return NextResponse.json({ message: "Sales Order not found" }, { status: 404 });

    await Promise.all(
      order.attachments.map(async (att) => {
        const p = path.join(process.cwd(), "public", att.fileUrl);
        try {
          await fs.unlink(p);
        } catch {}
      })
    );

    return NextResponse.json({ message: "Sales Order deleted" }, { status: 200 });
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json(
      { message: "Error deleting Sales Order", error: err.message },
      { status: 500 }
    );
  }
}








// import { NextResponse } from "next/server";
// import path from "path";
// import fs from "fs/promises";
// import formidable from "formidable";
// import { Readable } from "stream";

// import dbConnect from "@/lib/db";
// import SalesOrder from "@/models/SalesOrder";
// import { getTokenFromHeader, verifyJWT } from "@/lib/auth";
// import { sendStageChangeEmail } from "@/lib/stageEmail";   // ⬅️ new

// // ─── Next.js App‑router config ──────────────────────────────────────────────
// export const config = { api: { bodyParser: false } };

// // ─── helpers ────────────────────────────────────────────────────────────────
// function isAuthorized(user) {
//   if (user.type === "company") return true;
//   if (user.role === "Admin") return true;
//   if (user.role === "Sales Manager") return true; // limited
//   return user.permissions?.includes("sales");
// }

// /* Turn the Web Request into a minimal Node IncomingMessage for formidable */
// async function toNodeReq(request) {
//   const buf = Buffer.from(await request.arrayBuffer());
//   const nodeReq = new Readable({
//     read() {
//       this.push(buf);
//       this.push(null);
//     },
//   });
//   nodeReq.headers = Object.fromEntries(request.headers.entries());
//   nodeReq.method  = request.method;
//   nodeReq.url     = request.url || "/";
//   return nodeReq;
// }

// /* Parse multipart/form‑data */
// async function parseMultipart(request) {
//   const nodeReq = await toNodeReq(request);
//   const form = formidable({ multiples: true, keepExtensions: true });
//   return await new Promise((res, rej) =>
//     form.parse(nodeReq, (err, fields, files) => (err ? rej(err) : res({ fields, files })))
//   );
// }

// /* ─────────────────────────────  GET  ────────────────────────────────────── */
// export async function GET(req, { params }) {
//   try {
//     await dbConnect();
//     const { id } = await params;
//     const order = await SalesOrder.findById(id);
//     if (!order)
//       return NextResponse.json({ message: "Sales Order not found" }, { status: 404 });
//     return NextResponse.json({ success: true, data: order });
//   } catch (err) {
//     console.error("GET error:", err);
//     return NextResponse.json(
//       { message: "Error fetching Sales Order", error: err.message },
//       { status: 500 }
//     );
//   }
// }

// /* ─────────────────────────────  PUT  ────────────────────────────────────── */
// export async function PUT(req, { params }) {
//   try {
//     await dbConnect();
//     const { id } = await params;

//     // 1) Auth
//     const user = await verifyJWT(getTokenFromHeader(req));
//     if (!user || !isAuthorized(user))
//       return NextResponse.json({ message: "Forbidden" }, { status: 401 });

//     // 2) Current order (for stage‑change comparison)
//     const current = await SalesOrder.findById(id);
//     if (!current)
//       return NextResponse.json({ message: "Sales Order not found" }, { status: 404 });

//     // 3) Parse body
//     const cType = req.headers.get("content-type") || "";
//     let body = {};
//     let newFiles = [];
//     let removedFiles = [];

//     if (cType.includes("multipart/form-data")) {
//       const { fields, files } = await parseMultipart(req);
//       body = JSON.parse(fields.orderData || "{}");
//       removedFiles = JSON.parse(fields.removedFiles || "[]");
//       newFiles = Array.isArray(files.newFiles)
//         ? files.newFiles
//         : files.newFiles
//         ? [files.newFiles]
//         : [];
//     } else {
//       body = await req.json();
//     }

//     // 4) Limited role: can update only status + stage
//     const limited = user.role === "Sales Manager" && user.type !== "company";
//     if (limited) body = { status: body.status, statusStages: body.statusStages };

//     // 5) Remove nested _id fields
//     if (body.billingAddress && typeof body.billingAddress === "object")
//       delete body.billingAddress._id;
//     if (body.shippingAddress && typeof body.shippingAddress === "object")
//       delete body.shippingAddress._id;

//     // 6) Build safe updateDoc (no $set on attachments)
//     const { attachments: _omit, ...scalar } = body;
//     const updateDoc = { $set: scalar };

//     if (!limited) {
//       // Pull removed
//       if (removedFiles.length) {
//         updateDoc.$pull = {
//           attachments: { fileUrl: { $in: removedFiles.map((f) => f.fileUrl) } },
//         };
//         await Promise.all(
//           removedFiles.map(async (f) => {
//             const p = path.join(process.cwd(), "public", f.fileUrl);
//             try { await fs.unlink(p); } catch {}
//           })
//         );
//       }

//       // Push new
//       if (newFiles.length) {
//         const uploads = newFiles.map((f) => ({
//           fileName: f.originalFilename,
//           fileUrl: `/uploads/${path.basename(f.filepath)}`,
//           fileType: f.mimetype,
//           uploadedAt: new Date(),
//         }));
//         updateDoc.$push = { attachments: { $each: uploads } };
//       }
//     }

//     // 7) Update
//     const updated = await SalesOrder.findByIdAndUpdate(id, updateDoc, {
//       new: true,
//       runValidators: true,
//     });

//     // 8) Stage‑change email (after successful save)
//     await sendStageChangeEmail(updated, current.statusStages);

//     return NextResponse.json(
//       { message: "Sales Order updated", data: updated },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("PUT error:", err);
//     return NextResponse.json(
//       { message: "Error updating Sales Order", error: err.message },
//       { status: 500 }
//     );
//   }
// }

// /* ─────────────────────────────  DELETE  ─────────────────────────────────── */
// export async function DELETE(req, { params }) {
//   try {
//     await dbConnect();
//     const { id } = await params;
//     const user = await verifyJWT(getTokenFromHeader(req));
//     if (!user || (user.role !== "Admin" && user.type !== "company"))
//       return NextResponse.json({ message: "Forbidden" }, { status: 401 });

//     const order = await SalesOrder.findByIdAndDelete(id);
//     if (!order)
//       return NextResponse.json({ message: "Sales Order not found" }, { status: 404 });

//     // Remove physical files
//     await Promise.all(
//       order.attachments.map(async (att) => {
//         const p = path.join(process.cwd(), "public", att.fileUrl);
//         try { await fs.unlink(p); } catch {}
//       })
//     );

//     return NextResponse.json({ message: "Sales Order deleted" }, { status: 200 });
//   } catch (err) {
//     console.error("DELETE error:", err);
//     return NextResponse.json(
//       { message: "Error deleting Sales Order", error: err.message },
//       { status: 500 }
//     );
//   }
// }



