import { NextResponse } from "next/server";
import User from "@/models/user";
import SalesUser from "@/models/sales_user";
import MarketingUser from "@/models/marketing_user";
import Manager from "@/models/manager";
import DBConnect from "../../../../lib/DB_Connect";
import { getSession } from "../../../../lib/session";

async function memberProfileQueries(deptIds: string[], locIds: string[]) {
  const or: any[] = [];
  if (deptIds.length) or.push({ departmentId: { $in: deptIds } });
  if (locIds.length) or.push({ locationId: { $in: locIds } });
  if (!or.length) return { sales: [] as any[], marketing: [] as any[] };
  const [sales, marketing] = await Promise.all([
    SalesUser.find({ $or: or })
      .populate("departmentId", "name")
      .populate("locationId", "name")
      .lean(),
    MarketingUser.find({ $or: or })
      .populate("departmentId", "name")
      .populate("locationId", "name")
      .lean(),
  ]);
  return { sales, marketing };
}

export async function GET() {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const actor = await User.findById(session.userId).select("role").lean();
    if (!actor) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (actor.role === "sales" || actor.role === "marketing") {
      return NextResponse.json({ success: true, count: 0, data: [] }, { status: 200 });
    }

    let memberIds: string[] | null = null;

    if (actor.role === "manager") {
      const mgr = await Manager.findOne({ userId: actor._id }).lean();
      const deptIds = (mgr?.managedDepartments || []).map((id: any) => id.toString());
      const locIds = (mgr?.managedLocations || []).map((id: any) => id.toString());
      const { sales, marketing } = await memberProfileQueries(deptIds, locIds);
      memberIds = [
        ...new Set([...sales, ...marketing].map((p: any) => p.userId.toString())),
      ];
      if (memberIds.length === 0) {
        return NextResponse.json({ success: true, count: 0, data: [] }, { status: 200 });
      }
    }

    const userFilter: any = { role: { $in: ["sales", "marketing"] } };
    if (memberIds) {
      userFilter._id = { $in: memberIds };
    }

    const users = await User.find(userFilter).select("username email role").sort({ username: 1 }).lean();

    const ids = users.map((u: any) => u._id);
    const salesProfiles = await SalesUser.find({ userId: { $in: ids } })
      .populate("departmentId", "name")
      .populate("locationId", "name")
      .lean();
    const marketingProfiles = await MarketingUser.find({ userId: { $in: ids } })
      .populate("departmentId", "name")
      .populate("locationId", "name")
      .lean();

    const salesMap = new Map(salesProfiles.map((p: any) => [p.userId.toString(), p]));
    const mktMap = new Map(marketingProfiles.map((p: any) => [p.userId.toString(), p]));

    const data = users.map((u: any) => {
      const key = u._id.toString();
      const prof = u.role === "sales" ? salesMap.get(key) : mktMap.get(key);
      const active = prof ? Boolean(prof.active) : false;
      return {
        _id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        active,
        departmentId: prof?.departmentId || null,
        locationId: prof?.locationId || null,
      };
    });

    return NextResponse.json({ success: true, count: data.length, data }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Users GET Error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
