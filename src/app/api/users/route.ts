import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user";
import CommonUser from "@/models/common_user";
import TeamLeader from "@/models/team_leader";
import Manager from "@/models/manager";
import "@/models/department";
import "@/models/location";
import DBConnect from "../../../../lib/DB_Connect";
import { getSession } from "../../../../lib/session";

const HEARTBEAT_ONLINE_WINDOW_MS = 4 * 60 * 1000;

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
    const limit = url.searchParams.has("limit")
      ? Math.min(1000, Math.max(1, Number(url.searchParams.get("limit") || 1000)))
      : 1000;
    const search = (url.searchParams.get("search") || "").trim();
    const status = (url.searchParams.get("status") || "all").toLowerCase(); // all|enable|disable
    const roleFilter = (url.searchParams.get("role") || "").toLowerCase(); // Specific role filter

    if (actor.role === "admin_compliance") {
      const isOnlineByLastLogin = (lastLogin: Date | string | null | undefined): boolean => {
        if (!lastLogin) return false;
        const ts = new Date(lastLogin).getTime();
        if (Number.isNaN(ts)) return false;
        return Date.now() - ts <= HEARTBEAT_ONLINE_WINDOW_MS;
      };

      const allowedRoles = ['common', 'team_leader', 'manager', 'admin', 'common_compliance', 'admin_compliance'];
      const filteredRoles = roleFilter && allowedRoles.includes(roleFilter) ? [roleFilter] : allowedRoles;
      const userFilter: any = { role: { $in: filteredRoles } };
      if (search) {
        userFilter.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const total = await User.countDocuments(userFilter);
      const skip = (page - 1) * limit;
      const users = await User.find(userFilter)
        .select("_id username email role")
        .sort({ username: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const userIds = users.map((u: any) => u._id);

      const [commonProfiles, teamLeaderProfiles] = await Promise.all([
        CommonUser.find({ userId: { $in: userIds } })
          .select("userId active lastLogin departmentId locationId teamLeaderEmail")
          .lean(),
        TeamLeader.find({ userId: { $in: userIds } })
          .select("userId active lastLogin departmentId locationId")
          .lean(),
      ]);

      const commonMap = new Map(commonProfiles.map((p: any) => [p.userId.toString(), p]));
      const teamLeaderMap = new Map(teamLeaderProfiles.map((p: any) => [p.userId.toString(), p]));

      const data = users.map((u: any) => {
        const key = u._id.toString();

        if (u.role === "common" || u.role === "common_compliance") {
          const prof = commonMap.get(key);
          const active = Boolean(prof?.active);
          const pcActive = isOnlineByLastLogin(prof?.lastLogin);
          return {
            _id: u._id,
            username: u.username,
            email: u.email,
            role: u.role,
            active,
            pcActive,
            departmentId: prof?.departmentId || null,
            locationId: prof?.locationId || null,
            teamLeaderId: prof?.teamLeaderId || prof?.teamLeaderEmail || null,
          };
        }

        if (u.role === "team_leader") {
          const prof = teamLeaderMap.get(key);
          const active = Boolean(prof?.active);
          const pcActive = isOnlineByLastLogin(prof?.lastLogin);
          return {
            _id: u._id,
            username: u.username,
            email: u.email,
            role: u.role,
            active,
            pcActive,
            departmentId: prof?.departmentId || null,
            locationId: prof?.locationId || null,
            teamLeaderId: null,
          };
        }

        // Managers/admins aren't governed by CommonUser/TeamLeader profiles.
        const active = ['manager', 'admin', 'admin_compliance'].includes(u.role);
        return {
          _id: u._id,
          username: u.username,
          email: u.email,
          role: u.role,
          active,
          pcActive: active,
          departmentId: null,
          locationId: null,
          teamLeaderId: null,
        };
      });

      return NextResponse.json(
        { success: true, count: data.length, total, page, limit, data },
        { status: 200 },
      );
    }

    const profileFilter: any = {};
    if (actor.role === "manager") {
      const mgr = await Manager.findOne({ userId: actor._id }).lean();
      const deptIds = (mgr?.managedDepartments || []).map((id: any) => id.toString());
      if (!deptIds.length) {
        return NextResponse.json({ success: true, count: 0, total: 0, page, limit, data: [] }, { status: 200 });
      }
      profileFilter.departmentId = { $in: deptIds };
    } else if (actor.role === "team_leader") {
      const escapedEmail = (actor.email || "").replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      profileFilter.teamLeaderEmail = { $regex: `^${escapedEmail}$`, $options: "i" };
    }

    if (status === "enable") profileFilter.active = true;
    if (status === "disable") profileFilter.active = false;

    let commonUserProfiles: any[] = [];
    let teamLeaderProfiles: any[] = [];
    let managerProfiles: any[] = [];
    if (roleFilter === "team_leader") {
      commonUserProfiles = [];
      teamLeaderProfiles = await TeamLeader.find(profileFilter).populate("departmentId", "name").populate("locationId", "name").lean();
    } else if (roleFilter === "common") {
      commonUserProfiles = await CommonUser.find(profileFilter).populate("departmentId", "name").populate("locationId", "name").lean();
      teamLeaderProfiles = [];
    } else if (roleFilter === "manager") {
      commonUserProfiles = [];
      teamLeaderProfiles = [];
      managerProfiles = actor.role === "admin" ? await Manager.find(profileFilter).lean() : [];
    } else {
      // Default: get all three
      [commonUserProfiles, teamLeaderProfiles, managerProfiles] = await Promise.all([
        CommonUser.find(profileFilter).populate("departmentId", "name").populate("locationId", "name").lean(),
        TeamLeader.find(profileFilter).populate("departmentId", "name").populate("locationId", "name").lean(),
        actor.role === "admin" ? Manager.find({}).lean() : Promise.resolve([]),
      ]);
    }

    const allowedIds = [
      ...new Set([...commonUserProfiles, ...teamLeaderProfiles, ...managerProfiles].map((p: any) => p.userId.toString())),
    ];

    if (allowedIds.length === 0) {
      return NextResponse.json({ success: true, count: 0, total: 0, page, limit, data: [] }, { status: 200 });
    }

    const userFilter: any = { _id: { $in: allowedIds }, role: { $in: ["common", "team_leader", "manager"] } };
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
    const managerMap = new Map(managerProfiles.map((p: any) => [p.userId.toString(), p]));

    const data = users.map((u: any) => {
      const key = u._id.toString();
      let prof = null;
      if (u.role === "common") prof = commonMap.get(key);
      else if (u.role === "team_leader") prof = teamLeaderMap.get(key);
      else if (u.role === "manager") prof = managerMap.get(key);

      // Managers don't have an active flag yet, defaulting to true for them
      const active = u.role === "manager" ? true : (prof ? Boolean(prof.active) : false);
      const lastLoginAt = prof?.lastLogin ? new Date(prof.lastLogin).getTime() : 0;
      const isRecentHeartbeat = Number.isFinite(lastLoginAt) && lastLoginAt > 0 && (Date.now() - lastLoginAt <= HEARTBEAT_ONLINE_WINDOW_MS);
      return {
        _id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        active,
        // Treat managers as reachable by default; for tracked roles use heartbeat recency.
        pcActive: u.role === "manager" ? true : Boolean(isRecentHeartbeat),
        departmentId: prof?.departmentId || null,
        locationId: prof?.locationId || null,
        teamLeaderId: prof?.teamLeaderId || prof?.teamLeaderEmail || null,
      };
    });

    // Final security check for managers: strictly filter out any unexpected managers or admins
    // (though the logic above already tries to prevent this, let's be double sure)
    const filteredData = actor.role === "manager" 
      ? data.filter(u => u.role === "common" || u.role === "team_leader") 
      : data;

    return NextResponse.json({ success: true, count: filteredData.length, total: actor.role === "manager" ? filteredData.length : total, page, limit, data: filteredData }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Users GET Error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
