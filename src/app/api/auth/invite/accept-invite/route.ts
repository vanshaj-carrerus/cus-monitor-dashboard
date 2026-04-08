import { NextResponse } from "next/server";
import Invite from "@/models/invite";
import User from "@/models/user";
import CommonUser from "@/models/common_user";
import TeamLeader from "@/models/team_leader";
import Manager from "@/models/manager";
import bcrypt from "bcryptjs";
import DBConnect from "../../../../../../lib/DB_Connect";

export async function POST(request: Request) {
    try {
        await DBConnect();

        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
        }

        const invite = await Invite.findOne({ token, status: "pending" });

        if (!invite) {
            return NextResponse.json({ error: "Invalid or already accepted invite link." }, { status: 400 });
        }

        if (new Date(invite.expiresAt) < new Date()) {
            return NextResponse.json({ error: "Invite link has expired." }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: invite.email }).select("_id").lean();
        if (existingUser) {
            invite.status = "accepted";
            await invite.save();
            return NextResponse.json({ error: "User with this email already exists." }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const username = invite.email.split('@')[0] + '_' + Math.floor(Math.random() * 10000);

        let teamLeaderId = null;
        let teamLeaderEmail = null;
        if (invite.role === "common" && invite.teamLeaderId) {
            // Ensure teamLeaderId is in valid format - convert if it's an email string
            let tl = invite.teamLeaderId;
            if (typeof tl === 'string' && tl.includes('@')) {
                // It's an email, look up the user
                const teamLeaderUser = await User.findOne({ email: tl }).select("_id email").lean();
                if (teamLeaderUser) {
                    teamLeaderId = teamLeaderUser._id;
                    teamLeaderEmail = teamLeaderUser.email;
                }
            } else {
                // Assume it's an ObjectId, look up the email
                const teamLeaderUser = await User.findById(tl).select("email").lean();
                if (teamLeaderUser) {
                    teamLeaderId = tl;
                    teamLeaderEmail = teamLeaderUser.email;
                }
            }
        }

        const newUser = new User({
            username,
            email: invite.email,
            password: hashedPassword,
            role: invite.role,
            teamLeaderId,
        });

        await newUser.save();

        const roleData: any = {
            userId: newUser._id,
            active: true,
        };

        if (invite.departmentId) roleData.departmentId = invite.departmentId;
        if (invite.locationId) roleData.locationId = invite.locationId;
        if (invite.managerId) roleData.managerId = invite.managerId;
        if (invite.role === "common" && teamLeaderEmail) roleData.teamLeaderEmail = teamLeaderEmail;

        if (invite.role === "common") roleData.userEmail = invite.email.toLowerCase();
        if (invite.role === "common") {
            if (!roleData.departmentId || !roleData.teamLeaderEmail) {
                return NextResponse.json({ error: "Department and Team Leader are required for common users." }, { status: 400 });
            }
            const newCommonUser = new CommonUser(roleData);
            await newCommonUser.save();
        } else if (invite.role === "team_leader") {
            const newTeamLeader = new TeamLeader(roleData);
            await newTeamLeader.save();
        } else if (invite.role === "manager") {
            await new Manager({
                userId: newUser._id,
                managedDepartments: invite.departmentId ? [invite.departmentId] : [],
                managedLocations: invite.locationId ? [invite.locationId] : [],
            }).save();
        }

        invite.status = "accepted";
        await invite.save();

        return NextResponse.json({ message: "User account created successfully" }, { status: 200 });

    } catch (error: any) {
        console.error("Error accepting invite:", error);
        return NextResponse.json({ error: "Failed to create user", details: error.message }, { status: 500 });
    }
}
