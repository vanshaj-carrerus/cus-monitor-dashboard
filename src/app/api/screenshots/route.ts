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

            if ((targetUser.role === 'manager' || targetUser.role === 'admin') && actor.role !== 'admin' && actor.role !== 'admin_compliance') {
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }
            if ((targetUser.role === 'common_compliance' || targetUser.role === 'admin_compliance') && actor.role !== 'admin_compliance') {
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }

            if (actor.role === 'manager') {
                const mgr = await Manager.findOne({ userId: actor._id }).lean();
                const deptIds = (mgr?.managedDepartments || []).map((id: any) => id.toString());

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
            const page = Math.max(1, Number(url.searchParams.get("page") || 1));
            const limit = url.searchParams.has("limit")
                ? Math.min(1000, Math.max(1, Number(url.searchParams.get("limit") || 1000)))
                : null;
            const search = (url.searchParams.get("search") || "").trim();

            const allowedRoles = ['common', 'team_leader'];
            if (actor.role === 'admin' || actor.role === 'admin_compliance') {
                allowedRoles.push('manager');
            }
            if (actor.role === 'admin_compliance') {
                allowedRoles.push('admin', 'common_compliance', 'admin_compliance');
            }

            const userFilter: any = { role: { $in: allowedRoles } };
            if (search) {
                userFilter.$or = [
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ];
            }

            if (actor.role === 'manager') {
                const mgr = await Manager.findOne({ userId: actor._id }).lean();
                const deptIds = (mgr?.managedDepartments || []).map((id: any) => id.toString());

                if (deptIds.length) {
                    const [c, t] = await Promise.all([
                        CommonUser.find({ departmentId: { $in: deptIds } }).select("userId").lean(),
                        TeamLeader.find({ departmentId: { $in: deptIds } }).select("userId").lean()
                    ]);
                    const allowedIds = [...new Set([...c, ...t]
                        .filter((p: any) => p.userId != null)
                        .filter((p: any) => p.userId.toString() !== actor._id.toString())
                        .map((p: any) => p.userId.toString())
                    )];

                    if (allowedIds.length === 0) {
                        return NextResponse.json({ success: true, count: 0, data: [] }, { status: 200 });
                    }

                    userFilter._id = { $in: allowedIds };
                } else {
                    return NextResponse.json({ success: true, count: 0, data: [] }, { status: 200 });
                }
            } else if (actor.role === 'team_leader') {
                const members = await CommonUser.find({
                    teamLeaderEmail: { $regex: `^${(actor as any).email}$`, $options: 'i' }
                }).select("userId").lean();
                userFilter._id = { $in: members.map(m => m.userId.toString()) };
            }

            let query = User.find(userFilter).lean();
            if (limit !== null) {
                const skip = (page - 1) * limit;
                query = query.skip(skip).limit(limit);
            }
            const users = await query;
            return NextResponse.json({ success: true, count: users.length, data: users }, { status: 200 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
