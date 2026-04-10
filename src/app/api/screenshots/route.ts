import { NextRequest, NextResponse } from "next/server";
import Screenshot from "@/models/screenshot";
import User from "@/models/user";
import DBConnect from "../../../../lib/DB_Connect";
import { getSession } from "../../../../lib/session";

export async function GET(req: NextRequest) {
    try {
        await DBConnect();

        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const actor = await User.findById(session.userId).select('role').lean();
        if (!actor) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const filterUserId = url.searchParams.get("userId");

        if (filterUserId) {
            // Check if the requested user is a manager, and if so, explicitly verify actor is admin
            const targetUser = await User.findById(filterUserId).select('role').lean();
            if (targetUser && targetUser.role === 'manager' && actor.role !== 'admin') {
                 return NextResponse.json({ success: false, error: "Forbidden: Only admins can view manager screenshots" }, { status: 403 });
            }

            // Get screenshots for specific user
            const screenshots = await Screenshot.find({ userId: filterUserId }).sort({ createdAt: -1 }).lean();
            return NextResponse.json({ success: true, count: screenshots.length, data: screenshots }, { status: 200 });
        } else {
            // Get unique users who have screenshots, or just return all users with role common/team_leader/manager
            const allowedRoles = ['common', 'team_leader'];
            if (actor.role === 'admin') {
                allowedRoles.push('manager');
            }
            const users = await User.find({ role: { $in: allowedRoles } }).lean();
            return NextResponse.json({ success: true, count: users.length, data: users }, { status: 200 });
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
