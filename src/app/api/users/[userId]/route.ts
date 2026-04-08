import { NextResponse } from "next/server";
import mongoose from "mongoose";
import DBConnect from "../../../../../lib/DB_Connect";
import { getSession } from "../../../../../lib/session";
import User from "@/models/user";
import Manager from "@/models/manager";
import CommonUser from "@/models/common_user";
import TeamLeader from "@/models/team_leader";

type Ctx = { params: Promise<{ userId: string }> };

async function getManagerAllowedIds(managerUserId: string) {
  const mgr = await Manager.findOne({ userId: managerUserId }).lean();
  const deptIds = (mgr?.managedDepartments || []).map((id: any) => id.toString());
  const locIds = (mgr?.managedLocations || []).map((id: any) => id.toString());
  const or: any[] = [];
  if (deptIds.length) or.push({ departmentId: { $in: deptIds } });
  if (locIds.length) or.push({ locationId: { $in: locIds } });
  if (!or.length) return [];

  const [c, t] = await Promise.all([
    CommonUser.find({ $or: or }).select("userId").lean(),
    TeamLeader.find({ $or: or }).select("userId").lean(),
  ]);
  return [...new Set([...c, ...t].map((p: any) => p.userId.toString()))];
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
    let teamLeaderId = body.teamLeaderId || null;
    const active = typeof body.active === "boolean" ? body.active : null;

    // Validate and normalize teamLeaderId if it appears to be an email, look up the User
    if (teamLeaderId && teamLeaderId.includes('@')) {
      const teamLeaderUser = await User.findOne({ email: teamLeaderId }).select("_id").lean();
      if (teamLeaderUser) {
        teamLeaderId = teamLeaderUser._id.toString();
      } else {
        // Email doesn't exist, keep as is and let MongoDB handle the error
        teamLeaderId = teamLeaderId;
      }
    }

    if (actor.role === "admin") {
      if (username) updates.username = username;
      if (email) updates.email = email;
    }

    const target = await User.findById(userId).select("role").lean();
    if (!target || !["common", "team_leader"].includes(target.role)) {
      return NextResponse.json({ success: false, error: "Only member users can be edited here." }, { status: 400 });
    }

    if (Object.keys(updates).length) {
      await User.updateOne({ _id: userId }, { $set: updates });
    }

    const roleUpdate: any = {};
    if (departmentId !== null) roleUpdate.departmentId = departmentId || undefined;
    if (locationId !== null) roleUpdate.locationId = locationId || undefined;
    if (teamLeaderId !== null && target.role === "common") {
      const tlUser = await User.findById(teamLeaderId).select("email").lean();
      if (tlUser) {
        roleUpdate.teamLeaderEmail = tlUser.email;
      }
    }
    if (active !== null) roleUpdate.active = active;

    if (Object.keys(roleUpdate).length) {
      if (target.role === "common") {
        await CommonUser.updateOne({ userId }, { $set: roleUpdate });
      } else {
        await TeamLeader.updateOne({ userId }, { $set: roleUpdate });
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
    if (!target || !["common", "team_leader"].includes(target.role)) {
      return NextResponse.json({ success: false, error: "Only member users can be deleted here." }, { status: 400 });
    }

    await Promise.all([
      CommonUser.deleteOne({ userId }),
      TeamLeader.deleteOne({ userId }),
      User.deleteOne({ _id: userId }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

