import { NextResponse } from "next/server";
import Invite from "@/models/invite";
import User from "@/models/user";
import SalesUser from "@/models/sales_user";
import MarketingUser from "@/models/marketing_user";
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

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const username = invite.email.split('@')[0] + '_' + Math.floor(Math.random() * 10000);

        const newUser = new User({
            username,
            email: invite.email,
            password: hashedPassword,
            role: invite.role,
        });

        await newUser.save();

        const roleData: any = {
            userId: newUser._id,
            active: true,
        };

        if (invite.departmentId) roleData.departmentId = invite.departmentId;
        if (invite.locationId) roleData.locationId = invite.locationId;
        if (invite.managerId) roleData.managerId = invite.managerId;

        if (invite.role === "sales") {
            const newSalesUser = new SalesUser(roleData);
            await newSalesUser.save();
        } else if (invite.role === "marketing") {
            const newMarketingUser = new MarketingUser(roleData);
            await newMarketingUser.save();
        }

        invite.status = "accepted";
        await invite.save();

        return NextResponse.json({ message: "User account created successfully" }, { status: 200 });

    } catch (error: any) {
        console.error("Error accepting invite:", error);
        return NextResponse.json({ error: "Failed to create user", details: error.message }, { status: 500 });
    }
}
