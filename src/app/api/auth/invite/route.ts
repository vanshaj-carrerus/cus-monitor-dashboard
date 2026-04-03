import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import DBConnect from "../../../../../lib/DB_Connect";
import Invite from "@/models/invite";

export async function POST(request: Request) {
    try {
        await DBConnect();
        const body = await request.json();
        const { email, role, invitedBy } = body;

        if (!email || !role) {
            return NextResponse.json({ success: false, error: "Email and role are required." }, { status: 400 });
        }

        const token = crypto.randomBytes(32).toString("hex");

        const invite = await Invite.findOneAndUpdate(
            { email: email.toLowerCase() },
            {
                email: email.toLowerCase(),
                role: role.toLowerCase(),
                token,
                status: 'pending',
                expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Fetch Nodemailer configs
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        if (emailUser && emailPass) {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: { user: emailUser, pass: emailPass },
            });

            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (request.headers.get("origin") ?? "http://localhost:3000");
            const inviteLink = `${baseUrl}/accept-invite/${token}`;

            const mailOptions = {
                from: 'CUS Tech <CUS_Tech.solution@gmail.com>',
                to: email,
                subject: "You're Invited to Join CUS Spy Admin Dashboard",
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px;">
                    <div style="background-color: #4F46E5; padding: 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px;">Welcome to the Team!</h1>
                    </div>
                    <div style="padding: 30px; text-align: center; background-color: #ffffff;">
                        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">You have been invited${invitedBy ? ` by ${invitedBy}` : ''} to join the organization as a <strong>${role}</strong>.</p>
                        <a href="${inviteLink}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px;">Accept Invitation</a>
                    </div>
                </div>
                `
            };

            await transporter.sendMail(mailOptions);
        } else {
            console.warn("Nodemailer environment variables missing. Email was not sent.");
        }

        return NextResponse.json({ success: true, invite }, { status: 200 });

    } catch (error: any) {
        console.error("Error creating invite:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
