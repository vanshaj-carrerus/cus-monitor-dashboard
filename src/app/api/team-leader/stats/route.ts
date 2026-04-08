import { NextResponse } from "next/server";
import DBConnect from "../../../../../lib/DB_Connect";
import { getSession } from "../../../../../lib/session";
import User from "@/models/user";
import CommonUser from "@/models/common_user";
import ActivityLog from "@/models/activity_log";

export async function GET(request: Request) {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(session.userId).select("role _id email").lean();
    if (!user || user.role !== "team_leader") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const escapedEmail = (user.email || "").replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Get team members count with case-insensitive filtering
    const totalTeamMembers = await CommonUser.countDocuments({ teamLeaderEmail: { $regex: `^${escapedEmail}$`, $options: "i" } });
    const activeMembers = await CommonUser.countDocuments({ teamLeaderEmail: { $regex: `^${escapedEmail}$`, $options: "i" }, active: true });
    const inactiveMembers = await CommonUser.countDocuments({ teamLeaderEmail: { $regex: `^${escapedEmail}$`, $options: "i" }, active: false });

    // Get total activities for this team
    const memberIds = await CommonUser.find({ teamLeaderEmail: { $regex: `^${escapedEmail}$`, $options: "i" } }).select("userId").lean();
    const memberUserIds = memberIds.map((m: any) => m.userId);
    const totalActivities = await ActivityLog.countDocuments({ userId: { $in: memberUserIds } });

    return NextResponse.json({
      success: true,
      stats: {
        totalTeamMembers,
        activeMembers,
        inactiveMembers,
        totalActivities,
      }
    });
  } catch (error: any) {
    console.error("Error fetching team leader stats:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
