import { NextResponse } from "next/server";
import DBConnect from "../../../../lib/DB_Connect";
import { getSession } from "../../../../lib/session";
import User from "@/models/user";
import Manager from "@/models/manager";

export async function GET() {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "admin_compliance")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const managers = await User.find({ role: "manager" }).select("username email role").sort({ username: 1 }).lean();

    const ids = managers.map((m: any) => m._id);
    const profiles = await Manager.find({ userId: { $in: ids } })
      .populate("managedDepartments", "name")
      .populate("managedLocations", "name address")
      .lean();

    const byUser = new Map(profiles.map((p: any) => [p.userId.toString(), p]));

    const data = managers.map((m: any) => {
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
