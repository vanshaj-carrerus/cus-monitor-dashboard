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

    const user = await User.findById(session.userId).select("role _id email").lean();
    if (!user || user.role !== "team_leader") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const searchTerm = url.searchParams.get("search") || "";

    const escapedEmail = (user.email || "").replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Get team member IDs with case-insensitive filtering
    const teamMembers = await CommonUser.find({ teamLeaderEmail: { $regex: `^${escapedEmail}$`, $options: "i" } })
      .select("userId")
      .lean() as Array<{ userId: string }>;
    const teamMemberIds = teamMembers.map((m) => m.userId.toString());
    const allowedUserIds = Array.from(new Set([...teamMemberIds, user._id.toString()]));

    // Build search filter
    const searchQuery = searchTerm
      ? {
        $or: [
          { "userId.username": { $regex: searchTerm, $options: "i" } },
          { "userId.email": { $regex: searchTerm, $options: "i" } },
        ],
      }
      : {};

    // Get active streams for team members and the team leader
    const streams = await Stream.find({
      userId: { $in: allowedUserIds },
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
  } catch (error: unknown) {
    console.error("Error fetching team live streams:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
