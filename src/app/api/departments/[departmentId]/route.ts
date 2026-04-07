import { NextResponse } from "next/server";
import Department from "@/models/department";
import DBConnect from "../../../../../lib/DB_Connect";
import { getSession } from "../../../../../lib/session";

type Params = { params: Promise<{ departmentId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { departmentId } = await params;
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Department name is required." }, { status: 400 });
    }

    const updated = await Department.findByIdAndUpdate(
      departmentId,
      { $set: { name, description } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    return NextResponse.json({ department: updated, message: "Department updated successfully!" }, { status: 200 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Department with this name already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update department", details: error.message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { departmentId } = await params;
    const updated = await Department.findByIdAndUpdate(
      departmentId,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Department deleted successfully!" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete department", details: error.message }, { status: 500 });
  }
}

