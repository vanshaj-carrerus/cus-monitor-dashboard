import { NextRequest, NextResponse } from "next/server";
import Screenshot from "@/models/screenshot";
import User from "@/models/user";
import Manager from "@/models/manager";
import CommonUser from "@/models/common_user";
import TeamLeader from "@/models/team_leader";
import DBConnect from "../../../../lib/DB_Connect";
import { getSession } from "../../../../lib/session";

export async function GET(req: NextRequest) {
    try {
        await DBConnect();

        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const actor = await User.findById(session.userId).select('role email').lean();
        if (!actor) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const filterUserId = url.searchParams.get("userId");

        if (filterUserId) {
            const targetUser = await User.findById(filterUserId).select('role').lean();
            if (!targetUser) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

            // Security: Only admins can see Managers or Admins screenshots
            if ((targetUser.role === 'manager' || targetUser.role === 'admin') && actor.role !== 'admin') {
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }

            // Security: Managers can only see their department's users
            if (actor.role === 'manager') {
                const mgr = await Manager.findOne({ userId: actor._id }).lean();
                const deptIds = (mgr?.managedDepartments || []).map((id: any) => id.toString());

                // Managers cannot view their own or other managers' screenshots
                if (filterUserId === actor._id.toString()) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

                const [c, t] = await Promise.all([
                    CommonUser.findOne({ userId: filterUserId }).select("departmentId").lean(),
                    TeamLeader.findOne({ userId: filterUserId }).select("departmentId").lean()
                ]);
                const profile = c || (t as any);
                if (!profile) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

                const targetDeptId = profile.departmentId?.toString();
                if (!targetDeptId || !deptIds.includes(targetDeptId)) {
                    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
                }
            }

            // Security: Team Leaders can only see their team members
            if (actor.role === 'team_leader') {
                const member = await CommonUser.findOne({
                    userId: filterUserId,
                    teamLeaderEmail: { $regex: `^${(actor as any).email}$`, $options: 'i' }
                }).lean();
                if (!member) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }

            const screenshots = await Screenshot.find({ userId: filterUserId }).sort({ createdAt: -1 }).lean();
            return NextResponse.json({ success: true, count: screenshots.length, data: screenshots }, { status: 200 });
        } else {
            const allowedRoles = ['common', 'team_leader'];
            if (actor.role === 'admin') {
                allowedRoles.push('manager');
            }

            let userFilter: any = { role: { $in: allowedRoles } };

            if (actor.role === 'manager') {
                const mgr = await Manager.findOne({ userId: actor._id }).lean();
                const deptIds = (mgr?.managedDepartments || []).map((id: any) => id.toString());
                
                if (deptIds.length) {
                    const [c, t] = await Promise.all([
                        CommonUser.find({ departmentId: { $in: deptIds } }).select("userId").lean(),
                        TeamLeader.find({ departmentId: { $in: deptIds } }).select("userId").lean()
                    ]);
                    const allowedIds = [...new Set([...c, ...t].map((p: any) => p.userId.toString()))];
                    userFilter._id = { $in: allowedIds };
                } else {
                    return NextResponse.json({ success: true, count: 0, data: [] }, { status: 200 });
                }
            }
 else if (actor.role === 'team_leader') {
                const members = await CommonUser.find({
                    teamLeaderEmail: { $regex: `^${(actor as any).email}$`, $options: 'i' }
                }).select("userId").lean();
                userFilter._id = { $in: members.map(m => m.userId.toString()) };
            }

            const users = await User.find(userFilter).lean();
            return NextResponse.json({ success: true, count: users.length, data: users }, { status: 200 });
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
