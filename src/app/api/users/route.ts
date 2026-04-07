import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user";
import SalesUser from "@/models/sales_user";
import MarketingUser from "@/models/marketing_user";
import Manager from "@/models/manager";
import "@/models/department";
import "@/models/location";
import DBConnect from "../../../../lib/DB_Connect";
import { getSession } from "../../../../lib/session";

export async function GET(req: NextRequest) {
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

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 10)));
    const search = (url.searchParams.get("search") || "").trim();
    const status = (url.searchParams.get("status") || "all").toLowerCase(); // all|enable|disable

    const profileFilter: any = {};
    if (actor.role === "manager") {
      const mgr = await Manager.findOne({ userId: actor._id }).lean();
      const deptIds = (mgr?.managedDepartments || []).map((id: any) => id.toString());
      const locIds = (mgr?.managedLocations || []).map((id: any) => id.toString());
      const or: any[] = [];
      if (deptIds.length) or.push({ departmentId: { $in: deptIds } });
      if (locIds.length) or.push({ locationId: { $in: locIds } });
      if (!or.length) {
        return NextResponse.json({ success: true, count: 0, total: 0, page, limit, data: [] }, { status: 200 });
      }
      profileFilter.$or = or;
    }

    if (status === "enable") profileFilter.active = true;
    if (status === "disable") profileFilter.active = false;

    const [salesProfiles, marketingProfiles] = await Promise.all([
      SalesUser.find(profileFilter).populate("departmentId", "name").populate("locationId", "name").lean(),
      MarketingUser.find(profileFilter).populate("departmentId", "name").populate("locationId", "name").lean(),
    ]);

    const allowedIds = [
      ...new Set([...salesProfiles, ...marketingProfiles].map((p: any) => p.userId.toString())),
    ];

    if (allowedIds.length === 0) {
      return NextResponse.json({ success: true, count: 0, total: 0, page, limit, data: [] }, { status: 200 });
    }

    const userFilter: any = { _id: { $in: allowedIds }, role: { $in: ["sales", "marketing"] } };
    if (search) {
      userFilter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(userFilter);
    const skip = (page - 1) * limit;
    const users = await User.find(userFilter)
      .select("username email role")
      .sort({ username: 1 })
      .skip(skip)
      .limit(limit)
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

    return NextResponse.json({ success: true, count: data.length, total, page, limit, data }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Users GET Error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
