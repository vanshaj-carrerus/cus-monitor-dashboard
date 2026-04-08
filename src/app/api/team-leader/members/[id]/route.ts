import { NextResponse } from "next/server";
import DBConnect from "../../../../../../lib/DB_Connect";
import { getSession } from "../../../../../../lib/session";
import User from "@/models/user";
import CommonUser from "@/models/common_user";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: memberId } = await params;

    // Verify the member belongs to this team leader
    const member = await CommonUser.findOne({
      _id: memberId,
      teamLeaderEmail: user.email,
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Member not found in your team" },
        { status: 404 }
      );
    }

    // Remove teamLeaderId from the user record (don't delete the user, just unassign from team)
    await User.findByIdAndUpdate(member.userId, { $unset: { teamLeaderId: 1 } });

    // Delete the CommonUser record
    await CommonUser.deleteOne({ _id: memberId });

    return NextResponse.json({
      success: true,
      message: "Member removed from team",
    });
  } catch (error: any) {
    console.error("Error removing team member:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
