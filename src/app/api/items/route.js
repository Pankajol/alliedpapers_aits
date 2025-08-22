import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Item from "@/models/ItemModels";

// Connect to the database
await dbConnect();
// Create a new item
export async function POST(req) {
  await dbConnect();

  try {
    const data = await req.json();
    console.log("Received data from frontend:", JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.itemCode || !data.itemName || !data.category || !data.unitPrice || !data.quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save to DB
    const item = await Item.create(data);
    console.log("Saved item in DB:", JSON.stringify(item, null, 2));

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json({ success: false, error: error.message || "Error creating item" }, { status: 400 });
  }
}

// Get all items
export async function GET() {
  await dbConnect();
  try {
    
    const items = await Item.find({});
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

// // import dbConnect from "@/lib/db";
// // import Item from "@/models/ItemModels";

// export async function getStaticProps() {
//   await dbConnect();
//   const items = await Item.find().lean();

//   return {
//     props: { items: JSON.parse(JSON.stringify(items)) },
//   };
// }




