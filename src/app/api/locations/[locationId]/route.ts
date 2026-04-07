import { NextResponse } from "next/server";
import Location from "@/models/location";
import DBConnect from "../../../../../lib/DB_Connect";
import { getSession } from "../../../../../lib/session";

type Params = { params: Promise<{ locationId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { locationId } = await params;
    const { name, address } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Location name is required." }, { status: 400 });
    }

    const updated = await Location.findByIdAndUpdate(
      locationId,
      { $set: { name, address } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Location not found." }, { status: 404 });
    }

    return NextResponse.json({ location: updated, message: "Location updated successfully!" }, { status: 200 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Location with this name already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update location", details: error.message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { locationId } = await params;
    const updated = await Location.findByIdAndUpdate(
      locationId,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Location not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Location deleted successfully!" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete location", details: error.message }, { status: 500 });
  }
}

