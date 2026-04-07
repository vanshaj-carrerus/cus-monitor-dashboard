import { NextResponse } from "next/server";
import DBConnect from "../../../../../lib/DB_Connect";
import { getSession } from "../../../../../lib/session";
import User from "@/models/user";
import Manager from "@/models/manager";

export async function GET() {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(session.userId).select("-password").lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let managerProfile = null;
    if (user.role === "manager") {
      managerProfile = await Manager.findOne({ userId: user._id })
        .populate("managedDepartments", "name")
        .populate("managedLocations", "name address")
        .lean();
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        _id: user._id.toString(),
        managerProfile: managerProfile
          ? {
              managedDepartments: managerProfile.managedDepartments || [],
              managedLocations: managerProfile.managedLocations || [],
            }
          : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
