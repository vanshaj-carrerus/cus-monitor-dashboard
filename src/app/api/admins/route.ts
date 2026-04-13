import { NextResponse } from "next/server";
import DBConnect from "../../../../lib/DB_Connect";
import { getSession } from "../../../../lib/session";
import User from "@/models/user";
import Manager from "@/models/manager";

export async function GET() {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Find all users with admin role
    const admins = await User.find({ role: "admin" }).select("username email role").sort({ username: 1 }).lean();

    const ids = admins.map((m: any) => m._id);

    // Admins might also have department/location assignments (stored in Manager model for simplicity/reusability)
    const profiles = await Manager.find({ userId: { $in: ids } })
      .populate("managedDepartments", "name")
      .populate("managedLocations", "name address")
      .lean();

    const byUser = new Map(profiles.map((p: any) => [p.userId.toString(), p]));

    const data = admins.map((m: any) => {
      const prof = byUser.get(m._id.toString());
      return {
        _id: m._id.toString(),
        username: m.username,
        email: m.email,
        role: m.role,
        managedDepartments: prof?.managedDepartments || [],
        managedLocations: prof?.managedLocations || [],
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
