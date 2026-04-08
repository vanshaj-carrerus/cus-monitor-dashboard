import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user";
import CommonUser from "@/models/common_user";
import TeamLeader from "@/models/team_leader";
import Manager from "@/models/manager";
import "@/models/department";
import "@/models/location";
import TimeEntry from "@/models/time_entry";
import DBConnect from "../../../../lib/DB_Connect";
import { getSession } from "../../../../lib/session";

export async function GET(req: NextRequest) {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const actor = await User.findById(session.userId).select("role email").lean();
    if (!actor) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (actor.role === "common") {
      return NextResponse.json({ success: true, count: 0, data: [] }, { status: 200 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 10)));
    const search = (url.searchParams.get("search") || "").trim();
    const status = (url.searchParams.get("status") || "all").toLowerCase(); // all|enable|disable
    const roleFilter = (url.searchParams.get("role") || "").toLowerCase(); // Specific role filter

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
    } else if (actor.role === "team_leader") {
      const escapedEmail = (actor.email || "").replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      profileFilter.teamLeaderEmail = { $regex: `^${escapedEmail}$`, $options: "i" };
    }

    if (status === "enable") profileFilter.active = true;
    if (status === "disable") profileFilter.active = false;

    // Filter by specific role if requested
    let commonUserProfiles: any[] = [];
    let teamLeaderProfiles: any[] = [];
    if (roleFilter === "team_leader") {
      commonUserProfiles = [];
      teamLeaderProfiles = await TeamLeader.find(profileFilter).populate("departmentId", "name").populate("locationId", "name").lean();
    } else if (roleFilter === "common") {
      commonUserProfiles = await CommonUser.find(profileFilter).populate("departmentId", "name").populate("locationId", "name").lean();
      teamLeaderProfiles = [];
    } else {
      // Default: get both
      [commonUserProfiles, teamLeaderProfiles] = await Promise.all([
        CommonUser.find(profileFilter).populate("departmentId", "name").populate("locationId", "name").lean(),
        TeamLeader.find(profileFilter).populate("departmentId", "name").populate("locationId", "name").lean(),
      ]);
    }

    const allowedIds = [
      ...new Set([...commonUserProfiles, ...teamLeaderProfiles].map((p: any) => p.userId.toString())),
    ];

    if (allowedIds.length === 0) {
      return NextResponse.json({ success: true, count: 0, total: 0, page, limit, data: [] }, { status: 200 });
    }

    const userFilter: any = { _id: { $in: allowedIds }, role: { $in: ["common", "team_leader"] } };
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

    const commonMap = new Map(commonUserProfiles.map((p: any) => [p.userId.toString(), p]));
    const teamLeaderMap = new Map(teamLeaderProfiles.map((p: any) => [p.userId.toString(), p]));

    const data = users.map((u: any) => {
      const key = u._id.toString();
      const prof = u.role === "common" ? commonMap.get(key) : teamLeaderMap.get(key);
      const active = prof ? Boolean(prof.active) : false;
      return {
        _id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        active,
        pcActive: false,
        departmentId: prof?.departmentId || null,
        locationId: prof?.locationId || null,
        teamLeaderId: prof?.teamLeaderId || prof?.teamLeaderEmail || null,
      };
    });

    // Compute "PC active" via recent heartbeats (TimeEntry.sessions.lastHeartbeat).
    // Keep `active` as the existing account/profile activation flag used elsewhere.
    const cutoff = new Date(Date.now() - 4 * 60 * 1000);
    const recentEntries = await TimeEntry.find({
      userId: { $in: data.map((u: any) => u._id) },
      sessions: { $elemMatch: { lastHeartbeat: { $gte: cutoff } } },
    })
      .select("userId")
      .lean();

    const pcActiveIds = new Set(recentEntries.map((e: any) => e.userId.toString()));
    data.forEach((u: any) => {
      u.pcActive = pcActiveIds.has(u._id.toString());
    });

    return NextResponse.json({ success: true, count: data.length, total, page, limit, data }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Users GET Error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
