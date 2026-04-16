import { NextResponse } from "next/server";
import DBConnect from "../../../../../../lib/DB_Connect";
import { getSession } from "../../../../../../lib/session";
import Invite from "@/models/invite";
import User from "@/models/user";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ inviteId: string }> }
) {
    try {
        await DBConnect();
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const actor = await User.findById(session.userId).select("role").lean();
        if (!actor || (actor.role !== "admin" && actor.role !== "manager" && actor.role !== "team_leader" && actor.role !== "admin_compliance")) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        const { inviteId } = await params;

        // Find invite first to check permissions if needed
        const invite = await Invite.findById(inviteId);
        if (!invite) {
            return NextResponse.json({ success: false, error: "Invite not found" }, { status: 404 });
        }

        // Optional: Check if actor has permission to delete this specific invite
        // (e.g. they own the department or are the team leader assigned)

        await Invite.findByIdAndDelete(inviteId);

        return NextResponse.json({ success: true, message: "Invite deleted" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
