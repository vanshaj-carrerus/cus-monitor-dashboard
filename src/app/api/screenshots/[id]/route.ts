import { NextResponse } from "next/server";
import User from "@/models/user";
import Screenshot from "@/models/screenshot";
import CommonUser from "@/models/common_user";
import TeamLeader from "@/models/team_leader";
import Manager from "@/models/manager";
import { getSession } from "../../../../../lib/session";
import DBConnect from "../../../../../lib/DB_Connect";

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

        const user = await User.findById(session.userId).select("role _id").lean();
        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // Only admin, manager, and team_leader can delete screenshots
        if (!["admin", "manager", "team_leader"].includes(user.role)) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        const { id: screenshotId } = await params;

        // Find the screenshot
        const screenshot = await Screenshot.findById(screenshotId).populate("userId", "role").lean();
        if (!screenshot) {
            return NextResponse.json({ success: false, error: "Screenshot not found" }, { status: 404 });
        }

        // Check permissions based on role
        if (user.role === "team_leader") {
            // Team leaders can only delete screenshots from their team members
            const teamMember = await CommonUser.findOne({
                userId: screenshot.userId._id,
                teamLeaderId: user._id,
            }).lean();

            if (!teamMember) {
                return NextResponse.json(
                    { success: false, error: "You can only delete screenshots from your team members" },
                    { status: 403 }
                );
            }
        } else if (user.role === "manager") {
            // Managers can delete screenshots from users in their managed departments
            const mgr = await Manager.findOne({ userId: user._id }).lean();
            if (!mgr) return NextResponse.json({ success: false, error: "Manager profile not found" }, { status: 404 });

            const deptIds = (mgr.managedDepartments || []).map((id: any) => id.toString());
            if (deptIds.length === 0) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

            const [c, t] = await Promise.all([
                CommonUser.findOne({ userId: screenshot.userId._id }).select("departmentId").lean(),
                TeamLeader.findOne({ userId: screenshot.userId._id }).select("departmentId").lean()
            ]);
            const profile = c || (t as any);
            if (!profile) {
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }

            const targetDeptId = profile.departmentId?.toString();
            if (!targetDeptId || !deptIds.includes(targetDeptId)) {
                return NextResponse.json(
                    { success: false, error: "Forbidden: User is not in your managed departments" },
                    { status: 403 }
                );
            }
        }
        // Admin can delete any screenshot

        // Delete the screenshot
        await Screenshot.findByIdAndDelete(screenshotId);

        return NextResponse.json({
            success: true,
            message: "Screenshot deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting screenshot:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
