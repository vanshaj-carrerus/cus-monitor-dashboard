import { NextRequest, NextResponse } from "next/server";
import Screenshot from "@/models/screenshot";
import User from "@/models/user";
import DBConnect from "../../../../lib/DB_Connect";

export async function GET(req: NextRequest) {
    try {
        await DBConnect();

        const url = new URL(req.url);
        const filterUserId = url.searchParams.get("userId");

        if (filterUserId) {
            // Get screenshots for specific user
            const screenshots = await Screenshot.find({ userId: filterUserId }).sort({ createdAt: -1 }).lean();
            return NextResponse.json({ success: true, count: screenshots.length, data: screenshots }, { status: 200 });
        } else {
            // Get unique users who have screenshots, or just return all users with role common/team_leader
            const users = await User.find({ role: { $in: ['common', 'team_leader'] } }).lean();
            return NextResponse.json({ success: true, count: users.length, data: users }, { status: 200 });
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
