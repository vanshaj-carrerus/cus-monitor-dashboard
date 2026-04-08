import { NextResponse } from "next/server";
import User from "@/models/user";
import CommonUser from "@/models/common_user";
import TeamLeader from "@/models/team_leader";
import Manager from "@/models/manager";
import bcrypt from "bcryptjs";
import DBConnect from "../../../../../lib/DB_Connect";

export async function POST(request: Request) {
    try {
        await DBConnect();
        const body = await request.json();

        // Ensure graceful handling if structure doesn't match perfectly
        const userData = body.userData || body;
        const roleData = body.roleData || {};

        const { username, email, password, role } = userData;

        if (!username || !email || !password || !role) {
            return NextResponse.json({ success: false, error: "Missing required userData fields." }, { status: 400 });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return NextResponse.json({ success: false, error: "User with this email or username already exists." }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role,
        });
        await newUser.save();

        const roleEntry: any = { userId: newUser._id, active: true, ...roleData };
        if (role === 'common') {
            roleEntry.userEmail = email.toLowerCase();
            if (!roleData.departmentId || !roleData.teamLeaderId) {
                return NextResponse.json({ success: false, error: "Department and Team Leader are required for common users." }, { status: 400 });
            }
            // Get team leader email
            const tlUser = await User.findById(roleData.teamLeaderId).select("email").lean();
            if (!tlUser) {
                return NextResponse.json({ success: false, error: "Invalid team leader." }, { status: 400 });
            }
            roleEntry.teamLeaderEmail = tlUser.email;
            delete roleEntry.teamLeaderId; // Remove id, use email
            await new CommonUser(roleEntry).save();
        } else if (role === 'team_leader') {
            await new TeamLeader(roleEntry).save();
        } else if (role === 'manager') {
            await new Manager({
                userId: newUser._id,
                managedDepartments: roleData.departmentId ? [roleData.departmentId] : [],
                managedLocations: roleData.locationId ? [roleData.locationId] : [],
            }).save();
        }

        const userResponse = newUser.toObject();
        delete userResponse.password;

        return NextResponse.json({ success: true, user: userResponse }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
