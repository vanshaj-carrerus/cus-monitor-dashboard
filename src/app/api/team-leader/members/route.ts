import { NextResponse } from "next/server";
import DBConnect from "../../../../../lib/DB_Connect";
import { getSession } from "../../../../../lib/session";
import User from "@/models/user";
import CommonUser from "@/models/common_user";

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
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 10;
    const searchTerm = url.searchParams.get("search") || "";
    const filterStatus = url.searchParams.get("status") || "all";

    const skip = (page - 1) * limit;

    // Build search filter
    const searchQuery = searchTerm
      ? {
        $or: [
          { "userId.username": { $regex: searchTerm, $options: "i" } },
          { "userId.email": { $regex: searchTerm, $options: "i" } },
        ],
      }
      : {};

    // Build status filter
    const statusQuery =
      filterStatus === "enable"
        ? { active: true }
        : filterStatus === "disable"
          ? { active: false }
          : {};

    // Get team members
    const members = await CommonUser.find({
      teamLeaderEmail: user.email,
      ...statusQuery,
      ...searchQuery,
    })
      .populate("userId", "username email _id")
      .populate("departmentId", "name _id")
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await CommonUser.countDocuments({
      teamLeaderEmail: user.email,
      ...statusQuery,
      ...searchQuery,
    });

    // Transform to include user details in root
    const data = members.map((m: any) => ({
      _id: m._id,
      username: m.userId?.username || m.userId?.email,
      email: m.userId?.email,
      userId: m.userId?._id,
      departmentId: m.departmentId,
      active: m.active,
    }));

    return NextResponse.json({
      success: true,
      data,
      page,
      limit,
      total,
    });
  } catch (error: any) {
    console.error("Error fetching team members:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
