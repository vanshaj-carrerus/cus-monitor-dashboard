import { NextResponse } from "next/server";
import DBConnect from "../../../../../lib/DB_Connect";
import { getSession } from "../../../../../lib/session";
import User from "@/models/user";
import CommonUser from "@/models/common_user";
import TimeEntry from "@/models/time_entry";

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
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Get team member IDs
    const teamMembers = await CommonUser.find({ teamLeaderEmail: user.email }).select("userId").lean();
    const teamMemberIds = teamMembers.map((m: any) => m.userId);

    // Build search filter
    const searchQuery = searchTerm
      ? {
        $or: [
          { "userId.username": { $regex: searchTerm, $options: "i" } },
          { "userId.email": { $regex: searchTerm, $options: "i" } },
        ],
      }
      : {};

    // Build date filter
    const dateQuery: any = {};
    if (startDate) {
      dateQuery.createdAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      dateQuery.createdAt = { ...dateQuery.createdAt, $lte: new Date(endDate) };
    }

    // Get time entries for team members
    const timeEntries = await TimeEntry.find({
      userId: { $in: teamMemberIds },
      ...searchQuery,
      ...dateQuery,
    })
      .populate("userId", "username email _id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await TimeEntry.countDocuments({
      userId: { $in: teamMemberIds },
      ...searchQuery,
      ...dateQuery,
    });

    return NextResponse.json({
      success: true,
      data: timeEntries,
      page,
      limit,
      total,
    });
  } catch (error: any) {
    console.error("Error fetching team time tracking:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
