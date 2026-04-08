import { NextResponse } from "next/server";
import DBConnect from "../../../../../lib/DB_Connect";
import { getSession } from "../../../../../lib/session";
import User from "@/models/user";
import CommonUser from "@/models/common_user";
import Stream from "@/models/stream";

export async function GET(request: Request) {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(session.userId).select("role _id").lean();
    if (!user || user.role !== "team_leader") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const searchTerm = url.searchParams.get("search") || "";

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

    // Get active streams for team members (only active streams)
    const streams = await Stream.find({
      userId: { $in: teamMemberIds },
      active: true,
      ...searchQuery,
    })
      .populate("userId", "username email _id")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: streams,
    });
  } catch (error: any) {
    console.error("Error fetching team live streams:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
