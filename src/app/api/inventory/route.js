// import dbConnect from '@/lib/db';
// import Inventory from '@/models/Inventory';
// import BOM from '@/models/BOM';
// import '@/models/warehouseModels';
// import '@/models/ItemModels';

// export async function GET(req) {
//   await dbConnect();

//   const { searchParams } = new URL(req.url);
//   const itemId = searchParams.get('item');       // optional
//   const warehouse = searchParams.get('warehouse'); // optional
//   const bomId = searchParams.get('bomId');       // optional

//   let query = {};

//   // Priority 1: itemId (with optional warehouse)
//   if (itemId) {
//     query.item = itemId;
//     if (warehouse) query.warehouse = warehouse;
//   }

//   // Priority 2: bomId (fallback if no itemId)
//   else if (bomId) {
//     const bom = await BOM.findById(bomId).lean();
//     if (!bom) {
//       return new Response(
//         JSON.stringify({ success: false, message: "BOM not found" }),
//         { status: 404, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     if (!bom.productNo.itemCode) {
//       return new Response(
//         JSON.stringify({ success: false, message: "productNo missing in BOM" }),
//         { status: 400, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     query.item = bom.productNo;
//     if (bom.warehouse) query.warehouse = bom.warehouse;
//   }

//   // Priority 3: No filters = return all inventory
//   if (Object.keys(query).length === 0) {
//     try {
//       const inventories = await Inventory.find({})
//         .populate('warehouse')
//         .populate('item')
//         .lean();

//       return new Response(
//         JSON.stringify({ success: true, data: inventories }),
//         { status: 200, headers: { "Content-Type": "application/json" } }
//       );
//     } catch (error) {
//       console.error("Error fetching inventories:", error);
//       return new Response(
//         JSON.stringify({ success: false, message: error.message }),
//         { status: 500, headers: { "Content-Type": "application/json" } }
//       );
//     }
//   }

//   // Final: fetch filtered inventory
//   try {
//     const inventory = await Inventory.findOne(query)
//       .populate('warehouse')
      
//       .populate('item')
//       .lean();

//     if (!inventory) {
//       return new Response(
//         JSON.stringify({ success: false, message: "No inventory found for given item/warehouse/BOM" }),
//         { status: 404, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     return new Response(
//       JSON.stringify({ success: true, inventory, batches: inventory.batches }),
//       { status: 200, headers: { "Content-Type": "application/json" } }
//     );
//   } catch (error) {
//     console.error("Error fetching inventory:", error);
//     return new Response(
//       JSON.stringify({ success: false, message: error.message }),
//       { status: 500, headers: { "Content-Type": "application/json" } }
//     );
//   }
// }



import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Inventory from '@/models/Inventory';
import '@/models/warehouseModels';
import '@/models/ItemModels';
import BOM from '@/models/BOM';

export async function GET() {
  await dbConnect();

  try {
    const inventories = await Inventory.find({})
      .populate('warehouse')
      .populate('item', 'itemCode itemName')
      .populate({
    path: 'productNo',        // Inventory → BOM
    model: 'BOM',
    populate: {
      path: 'productNo',      // BOM → Item
      model: 'Item',
      select: 'itemCode itemName'
    }
  })
  .lean();
  // console.dir(inventories[25], { depth: null });

    return NextResponse.json({ success: true, data: inventories });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}






// import dbConnect from '@/lib/db';
// import Inventory from '@/models/Inventory';
// import '@/models/warehouseModels';
// import '@/models/ItemModels';


// export async function GET(req) {
//   await dbConnect();
  
//   const { searchParams } = new URL(req.url);
//   const itemId = searchParams.get('item');
//   const warehouse = searchParams.get('warehouse'); // e.g. warehouse ID
//   const bom = await BOM.findById(bomId).lean();
//   if (!bom) {
//     return new Response(
//       JSON.stringify({ success: false, message: "BOM not found" }),
//       { status: 404, headers: { "Content-Type": "application/json" } }
//     );
//   }

  
//   if (itemId) {
//     const query = { item: itemId };
//     if (warehouse) {
//       query.warehouse = warehouse;
//     }
//     try {
     
//       const inventory = await Inventory.findOne(query)
//         .populate('warehouse')
//         .populate('item')
//         .lean();
//       if (!inventory) {
//         return new Response(
//           JSON.stringify({ success: false, message: "No inventory found for this item and warehouse" }),
//           { status: 404, headers: { "Content-Type": "application/json" } }
//         );
//       }
//       return new Response(
//         JSON.stringify({ success: true, batches: inventory.batches }),
//         { status: 200, headers: { "Content-Type": "application/json" } }
//       );
//     } catch (error) {
//       console.error("Error fetching inventory:", error);
//       return new Response(
//         JSON.stringify({ success: false, message: error.message }),
//         { status: 500, headers: { "Content-Type": "application/json" } }
//       );
//     }
//   } else {
//     // Optionally return all inventory records.
//     try {
//       const inventories = await Inventory.find({})
//         .populate('warehouse')
//         .populate('item')
//         .lean();
//       return new Response(
//         JSON.stringify({ success: true, data: inventories }),
//         { status: 200, headers: { "Content-Type": "application/json" } }
//       );
//     } catch (error) {
//       console.error("Error fetching inventories:", error);
//       return new Response(
//         JSON.stringify({ success: false, message: error.message }),
//         { status: 500, headers: { "Content-Type": "application/json" } }
//       );
//     }
//   }
// }

