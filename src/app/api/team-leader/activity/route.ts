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

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 10;
    const searchTerm = url.searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Get team member IDs with case-insensitive filtering
    const teamMembers = await CommonUser.find({ teamLeaderEmail: { $regex: `^${user.email}$`, $options: "i" } }).select("userId").lean();
    const teamMemberIds = teamMembers.map((m: any) => m.userId);

    // Build search filter
    const searchQuery = searchTerm
      ? {
        $or: [
          { description: { $regex: searchTerm, $options: "i" } },
          { type: { $regex: searchTerm, $options: "i" } },
          { appName: { $regex: searchTerm, $options: "i" } },
        ],
      }
      : {};

    // Get activities for team members
    const activities = await ActivityLog.find({
      userId: { $in: teamMemberIds },
      ...searchQuery,
    })
      .populate("userId", "username email _id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ActivityLog.countDocuments({
      userId: { $in: teamMemberIds },
      ...searchQuery,
    });

    return NextResponse.json({
      success: true,
      data: activities,
      page,
      limit,
      total,
    });
  } catch (error: any) {
    console.error("Error fetching team activity:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
