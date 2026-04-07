import { NextResponse } from "next/server";
import mongoose from "mongoose";
import DBConnect from "../../../../../lib/DB_Connect";
import { getSession } from "../../../../../lib/session";
import User from "@/models/user";
import Manager from "@/models/manager";

type Ctx = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user id" }, { status: 400 });
    }

    const user = await User.findById(userId).select("role").lean();
    if (!user || user.role !== "manager") {
      return NextResponse.json({ success: false, error: "User is not a manager" }, { status: 400 });
    }

    const body = await request.json();
    const managedDepartmentIds = Array.isArray(body.managedDepartmentIds) ? body.managedDepartmentIds : [];
    const managedLocationIds = Array.isArray(body.managedLocationIds) ? body.managedLocationIds : [];

    const deptIds = managedDepartmentIds.filter((id: string) => mongoose.Types.ObjectId.isValid(id));
    const locIds = managedLocationIds.filter((id: string) => mongoose.Types.ObjectId.isValid(id));

    const updated = await Manager.findOneAndUpdate(
      { userId },
      {
        $set: {
          managedDepartments: deptIds,
          managedLocations: locIds,
        },
      },
      { new: true, upsert: true }
    )
      .populate("managedDepartments", "name")
      .populate("managedLocations", "name address")
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        userId,
        managedDepartments: updated?.managedDepartments || [],
        managedLocations: updated?.managedLocations || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
