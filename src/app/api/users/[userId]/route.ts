import { NextResponse } from "next/server";
import mongoose from "mongoose";
import DBConnect from "../../../../../lib/DB_Connect";
import { getSession } from "../../../../../lib/session";
import User from "@/models/user";
import Manager from "@/models/manager";
import SalesUser from "@/models/sales_user";
import MarketingUser from "@/models/marketing_user";

type Ctx = { params: Promise<{ userId: string }> };

async function getManagerAllowedIds(managerUserId: string) {
  const mgr = await Manager.findOne({ userId: managerUserId }).lean();
  const deptIds = (mgr?.managedDepartments || []).map((id: any) => id.toString());
  const locIds = (mgr?.managedLocations || []).map((id: any) => id.toString());
  const or: any[] = [];
  if (deptIds.length) or.push({ departmentId: { $in: deptIds } });
  if (locIds.length) or.push({ locationId: { $in: locIds } });
  if (!or.length) return [];

  const [s, m] = await Promise.all([
    SalesUser.find({ $or: or }).select("userId").lean(),
    MarketingUser.find({ $or: or }).select("userId").lean(),
  ]);
  return [...new Set([...s, ...m].map((p: any) => p.userId.toString()))];
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { userId } = await params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user id" }, { status: 400 });
    }

    const actor = await User.findById(session.userId).select("role").lean();
    if (!actor) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (actor.role !== "admin" && actor.role !== "manager") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (actor.role === "manager") {
      const allowed = await getManagerAllowedIds(actor._id.toString());
      if (!allowed.includes(userId)) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json();
    const updates: any = {};
    const username = body.username ? String(body.username).trim() : null;
    const email = body.email ? String(body.email).toLowerCase().trim() : null;
    const departmentId = body.departmentId || null;
    const locationId = body.locationId || null;
    const active = typeof body.active === "boolean" ? body.active : null;

    if (actor.role === "admin") {
      if (username) updates.username = username;
      if (email) updates.email = email;
    }

    const target = await User.findById(userId).select("role").lean();
    if (!target || !["sales", "marketing"].includes(target.role)) {
      return NextResponse.json({ success: false, error: "Only member users can be edited here." }, { status: 400 });
    }

    if (Object.keys(updates).length) {
      await User.updateOne({ _id: userId }, { $set: updates });
    }

    const roleUpdate: any = {};
    if (departmentId !== null) roleUpdate.departmentId = departmentId || undefined;
    if (locationId !== null) roleUpdate.locationId = locationId || undefined;
    if (active !== null) roleUpdate.active = active;

    if (Object.keys(roleUpdate).length) {
      if (target.role === "sales") {
        await SalesUser.updateOne({ userId }, { $set: roleUpdate });
      } else {
        await MarketingUser.updateOne({ userId }, { $set: roleUpdate });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { userId } = await params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user id" }, { status: 400 });
    }

    const actor = await User.findById(session.userId).select("role").lean();
    if (!actor) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (actor.role !== "admin" && actor.role !== "manager") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (actor.role === "manager") {
      const allowed = await getManagerAllowedIds(actor._id.toString());
      if (!allowed.includes(userId)) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const target = await User.findById(userId).select("role").lean();
    if (!target || !["sales", "marketing"].includes(target.role)) {
      return NextResponse.json({ success: false, error: "Only member users can be deleted here." }, { status: 400 });
    }

    await Promise.all([
      SalesUser.deleteOne({ userId }),
      MarketingUser.deleteOne({ userId }),
      User.deleteOne({ _id: userId }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

