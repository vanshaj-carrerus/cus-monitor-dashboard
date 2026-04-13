import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import Invite from "@/models/invite";
import User from "@/models/user";
import Manager from "@/models/manager";
import Department from "@/models/department";
import DBConnect from "../../../../../lib/DB_Connect";
import { getSession } from "../../../../../lib/session";

export async function POST(request: Request) {
    try {
        await DBConnect();
        const session = await getSession();
        if (!session || session.role !== "admin") {
            return NextResponse.json({ success: false, error: "Only admins can perform bulk upload." }, { status: 403 });
        }

        const body = await request.json();
        const { users } = body;

        if (!users || !Array.isArray(users)) {
            return NextResponse.json({ success: false, error: "Users array is required." }, { status: 400 });
        }

        // Pre-fetch all departments and team leaders to avoid too many DB calls
        const allDepts = await Department.find({}).lean();
        const allTLs = await User.find({ role: "team_leader" }).select("email username").lean();

        const results = {
            successCount: 0,
            failedCount: 0,
            failures: [] as any[]
        };

        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;
        const transporter = (emailUser && emailPass) ? nodemailer.createTransport({
            service: "gmail",
            auth: { user: emailUser, pass: emailPass },
        }) : null;

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (request.headers.get("origin") ?? "http://localhost:3000");

        for (const userData of users) {
            const { name, email, role, departmentName, teamLeaderEmail, locationName } = userData;

            try {
                if (!email || !role) throw new Error("Email and role are required.");

                const r = String(role).toLowerCase();
                if (!["admin", "manager", "common", "team_leader"].includes(r)) {
                    throw new Error(`Invalid role: ${role}`);
                }

                // Resolve department
                let deptId = null;
                if (departmentName) {
                    const dept = allDepts.find(d => d.name.toLowerCase() === departmentName.toLowerCase());
                    if (dept) deptId = dept._id;
                }

                // Resolve team leader
                let tlId = null;
                if (teamLeaderEmail) {
                    const tl = allTLs.find(t => t.email.toLowerCase() === teamLeaderEmail.toLowerCase());
                    if (tl) tlId = tl._id;
                }

                if (r === "common" && (!deptId || !tlId)) {
                    throw new Error("Valid Department and Team Leader Email are required for common users.");
                }

                const token = crypto.randomBytes(32).toString("hex");
                const inviteData: any = {
                    email: email.toLowerCase(),
                    role: r,
                    name: name || email.split('@')[0],
                    token,
                    status: 'pending',
                    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                };
                if (deptId) inviteData.departmentId = deptId;
                if (tlId) inviteData.teamLeaderId = tlId;

                await Invite.findOneAndUpdate(
                    { email: email.toLowerCase() },
                    inviteData,
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );

                if (transporter) {
                    const inviteLink = `${baseUrl}/accept-invite/${token}`;
                    const mailOptions = {
                        from: 'CUS Tech <CUS_Tech.solution@gmail.com>',
                        to: email,
                        subject: "You're Invited to Join CUS Monitor",
                        html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px;">
                            <div style="background-color: #4F46E5; padding: 30px; text-align: center; color: white;">
                                <h1 style="margin: 0; font-size: 24px;">Welcome to the Team!</h1>
                            </div>
                            <div style="padding: 30px; text-align: center; background-color: #ffffff;">
                                <p style="font-size: 16px; color: #333; margin-bottom: 20px;">You have been invited to join the organization as a <strong>${role}</strong>.</p>
                                <a href="${inviteLink}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px;">Accept Invitation</a>
                            </div>
                        </div>
                        `
                    };
                    await transporter.sendMail(mailOptions);
                }

                results.successCount++;
            } catch (err: any) {
                results.failedCount++;
                results.failures.push({
                    userData,
                    error: err.message
                });
            }
        }

        return NextResponse.json({ success: true, ...results });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
