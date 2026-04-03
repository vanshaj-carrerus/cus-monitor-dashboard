import { NextResponse } from "next/server";
import crypto from "crypto";
import Invite from "@/models/invite";
import nodemailer from "nodemailer";
import DBConnect from "../../../../../../lib/DB_Connect";

export async function POST(request: Request) {
    try {
        await DBConnect();

        const { email, role, name, departmentId, locationId, managerId, contactNumber } = await request.json();

        if (!email || !role) {
            return NextResponse.json({ error: "Email and role are required." }, { status: 400 });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }

        const token = crypto.randomBytes(32).toString("hex");

        const inviteData: any = {
            email: email.toLowerCase(),
            role: role.toLowerCase(),
            token,
            status: 'pending',
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        };

        if (name) inviteData.name = name;
        if (contactNumber) inviteData.contactNumber = contactNumber;

        // Handle select placeholders
        if (departmentId && departmentId !== "Select department" && departmentId !== "") inviteData.departmentId = departmentId;
        if (locationId && locationId !== "Select location" && locationId !== "") inviteData.locationId = locationId;
        if (managerId && managerId !== "Select manager" && managerId !== "") inviteData.managerId = managerId;

        // Ensure email isn't already accepted/pending as a User
        const User = (await import("@/models/user")).default;
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json({ error: "User with this email already exists." }, { status: 400 });
        }

        // Upsert invite
        await Invite.findOneAndUpdate(
            { email: email.toLowerCase() },
            inviteData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        if (!emailUser || !emailPass) {
            throw new Error("Missing EMAIL_USER or EMAIL_PASS environment variables");
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: emailUser,
                pass: emailPass,
            },
        });

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (request.headers.get("origin") ?? "http://localhost:3000");
        const inviteLink = `${baseUrl}/accept-invite/${token}`;

        const mailOptions = {
            from: 'CUS Tech <CUS_Tech.solution@gmail.com>',
            to: email,
            subject: "You're Invited to Join CUS Spy Admin Dashboard",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #4F46E5; padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Welcome to the Team!</h1>
                </div>
                <div style="padding: 30px; text-align: center; background-color: #ffffff;">
                    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello ${name || 'there'},</p>
                    <p style="font-size: 16px; color: #555; margin-bottom: 30px;">You have been invited to join the organization as a <strong>${role}</strong>. Please click the button below to accept your invitation and set up your account.</p>
                    <a href="${inviteLink}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 16px;">Accept Invitation</a>
                    <p style="font-size: 14px; color: #888; margin-top: 30px;">This link will expire in 3 days.</p>
                </div>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ message: "Invite sent successfully" }, { status: 200 });

    } catch (error: any) {
        console.error("Error sending invite:", error);
        return NextResponse.json({ error: "Failed to send invite", details: error.message }, { status: 500 });
    }
}
