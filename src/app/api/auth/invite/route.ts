import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import DBConnect from "../../../../../lib/DB_Connect";
import { getSession } from "../../../../../lib/session";
import Invite from "@/models/invite";
import User from "@/models/user";
import Manager from "@/models/manager";
import Department from "@/models/department";

export async function GET() {
    try {
        await DBConnect();
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const actor = await User.findById(session.userId).select("role").lean();
        if (!actor || (actor.role !== "admin" && actor.role !== "manager" && actor.role !== "team_leader" && actor.role !== "admin_compliance")) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        let query: any = { status: "pending" };

        // If manager or team leader, filter by what they can see
        if (actor.role === "manager") {
            const mgr = await Manager.findOne({ userId: actor._id }).lean();
            const deptIds = (mgr?.managedDepartments || []);
            query.departmentId = { $in: deptIds };
        } else if (actor.role === "team_leader") {
            query.teamLeaderId = actor._id;
        }

        const invites = await Invite.find(query)
            .populate("departmentId", "name")
            .populate("teamLeaderId", "username email")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, invites });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await DBConnect();
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const actor = await User.findById(session.userId).select("role").lean();
        if (!actor || (actor.role !== "admin" && actor.role !== "manager" && actor.role !== "team_leader" && actor.role !== "admin_compliance")) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { email, role, name, departmentId, locationId, teamLeaderId, invitedBy } = body;

        if (!email || !role) {
            return NextResponse.json({ success: false, error: "Email and role are required." }, { status: 400 });
        }

        const r = String(role).toLowerCase();

        const allowedRoles = (actor.role === "admin" || actor.role === "admin_compliance")
            ? ["common", "team_leader", "manager", "admin", "common_compliance", "admin_compliance"]
            : actor.role === "manager"
                ? ["common", "team_leader"]
                : ["common"];

        if (!allowedRoles.includes(r)) {
            return NextResponse.json({ success: false, error: "Invalid role or permission denied." }, { status: 403 });
        }

        if (r === "common" && (!departmentId || !teamLeaderId)) {
            return NextResponse.json({ success: false, error: "Department and Team Leader are required for common users." }, { status: 400 });
        }

        if (r === "common_compliance" && !departmentId) {
            return NextResponse.json({ success: false, error: "Department is required for compliance users." }, { status: 400 });
        }

        if (actor.role === "manager") {
            if (["admin", "manager", "common_compliance", "admin_compliance"].includes(r)) {
                return NextResponse.json({ success: false, error: "Managers cannot invite this role." }, { status: 403 });
            }
            const mgr = await Manager.findOne({ userId: actor._id }).lean();
            const deptIds = (mgr?.managedDepartments || []).map((id: any) => id.toString());
            const locIds = (mgr?.managedLocations || []).map((id: any) => id.toString());
            if (departmentId && !deptIds.includes(String(departmentId))) {
                return NextResponse.json({ success: false, error: "Department not in your scope." }, { status: 403 });
            }
            if (locationId && !locIds.includes(String(locationId))) {
                return NextResponse.json({ success: false, error: "Location not in your scope." }, { status: 403 });
            }
        } else if (actor.role === "team_leader") {
            if (r !== "common") {
                return NextResponse.json({ success: false, error: "Team leaders can only invite common users." }, { status: 403 });
            }
            if (teamLeaderId !== actor._id.toString()) {
                return NextResponse.json({ success: false, error: "Team leaders can only invite to their own team." }, { status: 403 });
            }
        }

        const token = crypto.randomBytes(32).toString("hex");

        const updateData: any = {
            email: email.toLowerCase(),
            role: role.toLowerCase(),
            token,
            status: 'pending',
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        };
        if (name) updateData.name = name;
        if (departmentId) updateData.departmentId = departmentId;
        if (locationId) updateData.locationId = locationId;
        // Ensure teamLeaderId is properly formatted as ObjectId if provided
        if (teamLeaderId) {
            // If teamLeaderId is a string, validate it's a valid ObjectId format
            updateData.teamLeaderId = teamLeaderId;
        }

        const invite = await Invite.findOneAndUpdate(
            { email: email.toLowerCase() },
            updateData,
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
                subject: "You're Invited to Join CUS Monitor Admin Dashboard",
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
