import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lead from "@/models/load";

// GET /api/lead/:id - Fetch a specific lead
export async function GET(NextResponse, { params }) {
  try {
    await dbConnect();
    const lead = await Lead.findById(params.id);

    if (!lead) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead, { status: 200 });
  } catch (error) {
    console.error("GET Lead Error:", error);
    return NextResponse.json({ message: "Failed to fetch lead" }, { status: 500 });
  }
}

// PATCH /api/lead/:id - Update a specific lead
export async function PATCH(req, { params }) {
  try {
    const data = await req.json();
    await dbConnect();

    const updatedLead = await Lead.findByIdAndUpdate(params.id, data, {
      new: true,
      runValidators: true,
    });

    if (!updatedLead) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(updatedLead, { status: 200 });
  } catch (error) {
    console.error("PATCH Lead Error:", error);
    return NextResponse.json({ message: "Failed to update lead" }, { status: 500 });
  }
}

// DELETE /api/lead/:id - Delete a specific lead
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const deletedLead = await Lead.findByIdAndDelete(params.id);

    if (!deletedLead) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Lead deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE Lead Error:", error);
    return NextResponse.json({ message: "Failed to delete lead" }, { status: 500 });
  }
}
