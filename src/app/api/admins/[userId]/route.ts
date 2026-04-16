import { NextResponse } from "next/server";
import User from "@/models/user";
import Manager from "@/models/manager";
import DBConnect from "../../../../../lib/DB_Connect";
import { getSession } from "../../../../../lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "admin_compliance")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { role, managedDepartmentIds, managedLocationIds } = body;

    const target = await User.findById(userId).select("role").lean();
    if (!target) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    if (target.role === "admin_compliance" && session.role !== "admin_compliance") {
      return NextResponse.json({ success: false, error: "Forbidden: Only admin_compliance can manage compliance admins." }, { status: 403 });
    }
    if (role === "admin_compliance" && session.role !== "admin_compliance") {
      return NextResponse.json({ success: false, error: "Forbidden: Only admin_compliance can assign compliance admin role." }, { status: 403 });
    }

    // Update role if provided
    if (role) {
      await User.findByIdAndUpdate(userId, { role });
    }

    // Update assignments in Manager model (reused for Admin/Manager role)
    if (managedDepartmentIds || managedLocationIds) {
      await Manager.findOneAndUpdate(
        { userId },
        {
          managedDepartments: managedDepartmentIds,
          managedLocations: managedLocationIds,
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
