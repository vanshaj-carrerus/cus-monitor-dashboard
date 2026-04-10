import { NextRequest, NextResponse } from "next/server";
import DBConnect from "../../../../../lib/DB_Connect";
import { getSession } from "../../../../../lib/session";
import User from "@/models/user";
import TimeEntry from "@/models/time_entry";
import ActivityLog from "@/models/activity_log";
import CommonUser from "@/models/common_user";
import TeamLeader from "@/models/team_leader";
import Manager from "@/models/manager";

type ObjectIdLike = { toString(): string };
type Actor = { _id: ObjectIdLike; role?: string };
type AllowedUser = { _id: ObjectIdLike; username?: string; role?: string };
type ProfileRow = { userId: ObjectIdLike; active?: boolean };
type TimeEntryRow = {
  userId: ObjectIdLike;
  date: Date;
  productiveSeconds?: number;
  unproductiveSeconds?: number;
  totalTrackedSeconds?: number;
};

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfDayUtc(ymd: string) {
  return new Date(`${ymd}T00:00:00.000Z`);
}

function endOfDayUtc(ymd: string) {
  return new Date(`${ymd}T23:59:59.999Z`);
}

function clampNonNeg(n: number) {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function secondsToHms(totalSeconds: number) {
  const s = clampNonNeg(Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad2 = (x: number) => String(x).padStart(2, "0");
  return `${hours}:${pad2(mins)}:${pad2(secs)}`;
}

const PIE_COLORS = ["#4ADE80", "#60A5FA", "#F87171", "#A78BFA", "#FACC15"];

function toPieItems(rows: { name: string; seconds: number }[]) {
  const total = rows.reduce((acc, r) => acc + clampNonNeg(r.seconds), 0);

  const top = rows
    .filter(r => clampNonNeg(r.seconds) > 0 && r.name)
    .sort((a, b) => clampNonNeg(b.seconds) - clampNonNeg(a.seconds))
    .slice(0, 4);

  const topSeconds = top.reduce((acc, r) => acc + clampNonNeg(r.seconds), 0);
  const otherSeconds = clampNonNeg(total - topSeconds);

  const items = top.map((r, idx) => ({
    name: r.name,
    pct: total > 0 ? `${((clampNonNeg(r.seconds) / total) * 100).toFixed(1)}%` : "0.0%",
    time: secondsToHms(r.seconds),
    color: PIE_COLORS[idx % PIE_COLORS.length],
  }));

  items.push({
    name: "Other",
    pct: total > 0 ? `${((otherSeconds / total) * 100).toFixed(1)}%` : "0.0%",
    time: "",
    color: PIE_COLORS[4],
  });

  return items;
}

async function resolveAllowedUsers(actor: Actor): Promise<AllowedUser[]> {
  const userFilter: Record<string, unknown> = { role: { $in: ["common", "team_leader"] } };

  if (actor.role === "common" || actor.role === "team_leader") {
    (userFilter as { _id: ObjectIdLike })._id = actor._id;
  } else if (actor.role === "manager") {
    const mgr = (await Manager.findOne({ userId: actor._id }).lean()) as unknown as {
      managedDepartments?: ObjectIdLike[];
    } | null;
    const deptIds = (mgr?.managedDepartments || []).map((id) => id.toString());
    
    if (!deptIds.length) return [];

    const [c, t] = (await Promise.all([
      CommonUser.find({ departmentId: { $in: deptIds } }).select("userId active").lean(),
      TeamLeader.find({ departmentId: { $in: deptIds } }).select("userId active").lean(),
    ])) as unknown as [ProfileRow[], ProfileRow[]];
    const allowedIds = [...new Set([...c, ...t].map((p) => p.userId.toString()))];
    if (!allowedIds.length) return [];
    
    // Explicitly exclude the manager themselves from the metrics
    const filteredIds = allowedIds.filter(id => id !== actor._id.toString());
    if (!filteredIds.length) return [];

    (userFilter as { _id: unknown })._id = { $in: filteredIds };
  }

  const users = (await User.find(userFilter).select("_id username role").lean()) as unknown as AllowedUser[];
  return users;
}

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

    const url = new URL(req.url);
    const startDateParam = url.searchParams.get("startDate") || "";
    const endDateParam = url.searchParams.get("endDate") || "";

    const todayYmd = toYmd(new Date());
    const endYmd = endDateParam || todayYmd;
    const startYmd = startDateParam || toYmd(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

    const start = startOfDayUtc(startYmd);
    const end = endOfDayUtc(endYmd);

    const users = await resolveAllowedUsers(actor as unknown as Actor);
    if (!users.length) {
      return NextResponse.json(
        {
          success: true,
          connectedNow: { total: 0, active: 0, inactive: 0 },
          totals: { activeSeconds: 0, productiveSeconds: 0, unproductiveSeconds: 0, neutralSeconds: 0 },
          series: [],
          websites: toPieItems([]),
          apps: toPieItems([]),
          topMembers: [],
          lessMembers: [],
        },
        { status: 200 }
      );
    }

    const userIds = users.map((u) => u._id);
    const usernames = users.map((u) => u.username).filter((v): v is string => Boolean(v));
    const activityUserIds = [...new Set([...userIds.map((id) => id.toString()), ...usernames])];

    const [commonProfiles, teamLeaderProfiles] = (await Promise.all([
      CommonUser.find({ userId: { $in: userIds } }).select("userId active").lean(),
      TeamLeader.find({ userId: { $in: userIds } }).select("userId active").lean(),
    ])) as unknown as [ProfileRow[], ProfileRow[]];
    const activeMap = new Map<string, boolean>();
    for (const p of [...commonProfiles, ...teamLeaderProfiles]) {
      activeMap.set(p.userId.toString(), Boolean(p.active));
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeLogsPerUser = await ActivityLog.find({
      userId: { $in: activityUserIds },
      createdAt: { $gte: fiveMinutesAgo }
    }).select("userId").lean();

    const activeIds = new Set(activeLogsPerUser.map(l => l.userId));
    const connectedTotal = users.length;
    const connectedActive = userIds.filter(id => activeIds.has(id.toString())).length;
    const connectedInactive = Math.max(0, connectedTotal - connectedActive);

    const timeEntries = (await TimeEntry.find({
      userId: { $in: userIds },
      date: { $gte: startOfDayUtc(startYmd), $lte: startOfDayUtc(endYmd) },
    })
      .select("userId date productiveSeconds unproductiveSeconds totalTrackedSeconds")
      .lean()) as unknown as TimeEntryRow[];

    let activeSeconds = 0;
    let productiveSeconds = 0;
    let unproductiveSeconds = 0;

    const byDate = new Map<string, { productive: number; unproductive: number; active: number }>();
    const byUser = new Map<string, { productive: number; active: number }>();

    for (const te of timeEntries) {
      const dayKey = toYmd(new Date(te.date));
      const prod = clampNonNeg(Number(te.productiveSeconds || 0));
      const unprod = clampNonNeg(Number(te.unproductiveSeconds || 0));
      const tracked = clampNonNeg(Number(te.totalTrackedSeconds || 0));

      activeSeconds += tracked;
      productiveSeconds += prod;
      unproductiveSeconds += unprod;

      const d = byDate.get(dayKey) || { productive: 0, unproductive: 0, active: 0 };
      d.productive += prod;
      d.unproductive += unprod;
      d.active += tracked;
      byDate.set(dayKey, d);

      const uid = te.userId.toString();
      const u = byUser.get(uid) || { productive: 0, active: 0 };
      u.productive += prod;
      u.active += tracked;
      byUser.set(uid, u);
    }

    const neutralSeconds = clampNonNeg(activeSeconds - productiveSeconds - unproductiveSeconds);

    // Build a continuous daily series for the selected range
    const series: { name: string; productive: number; unproductive: number; neutral: number }[] = [];
    for (let d = startOfDayUtc(startYmd); d <= startOfDayUtc(endYmd); d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
      const key = toYmd(d);
      const v = byDate.get(key) || { productive: 0, unproductive: 0, active: 0 };
      const neutral = clampNonNeg(v.active - v.productive - v.unproductive);
      series.push({
        name: key,
        productive: Math.round(v.productive / 60), // minutes for chart readability
        unproductive: Math.round(v.unproductive / 60),
        neutral: Math.round(neutral / 60),
      });
    }

    // Top/Less productive members based on productive seconds
    const usersById = new Map(users.map((u) => [u._id.toString(), u]));
    const userProdRows = userIds.map((id) => {
      const uid = id.toString();
      const totals = byUser.get(uid) || { productive: 0, active: 0 };
      return { uid, productive: totals.productive, active: totals.active };
    });

    const topMembers = userProdRows
      .slice()
      .sort((a, b) => clampNonNeg(b.productive) - clampNonNeg(a.productive))
      .slice(0, 3)
      .map(r => ({ name: usersById.get(r.uid)?.username || r.uid }));

    const lessMembers = userProdRows
      .filter(r => clampNonNeg(r.active) > 0)
      .slice()
      .sort((a, b) => clampNonNeg(a.productive) - clampNonNeg(b.productive))
      .slice(0, 2)
      .map(r => ({ name: usersById.get(r.uid)?.username || r.uid }));

    // Websites & Apps usage from ActivityLog
    const activityFilter: Record<string, unknown> = {
      userId: { $in: activityUserIds },
      start_time: { $gte: start, $lte: end },
    };

    const [webAgg, appAgg] = await Promise.all([
      ActivityLog.aggregate([
        { $match: { ...activityFilter, site: { $ne: null } } },
        { $group: { _id: "$site", seconds: { $sum: "$duration_seconds" } } },
        { $project: { _id: 0, name: "$_id", seconds: 1 } },
      ]),
      ActivityLog.aggregate([
        { $match: { ...activityFilter, $or: [{ site: null }, { site: { $exists: false } }] } },
        { $group: { _id: "$app_name", seconds: { $sum: "$duration_seconds" } } },
        { $project: { _id: 0, name: "$_id", seconds: 1 } },
      ]),
    ]);

    return NextResponse.json(
      {
        success: true,
        connectedNow: { total: connectedTotal, active: connectedActive, inactive: connectedInactive },
        totals: { activeSeconds, productiveSeconds, unproductiveSeconds, neutralSeconds },
        series,
        websites: toPieItems(webAgg || []),
        apps: toPieItems(appAgg || []),
        topMembers,
        lessMembers,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Dashboard metrics GET error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

