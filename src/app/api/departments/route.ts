import { NextResponse } from "next/server";
import Department from "@/models/department";
import Manager from "@/models/manager";
import User from "@/models/user";
import DBConnect from "../../../../lib/DB_Connect";
import { getSession } from "../../../../lib/session";

export async function GET() {
    try {
        await DBConnect();
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const actor = await User.findById(session.userId).select("role").lean();
        if (!actor) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let departments;
        if (actor.role === "manager") {
            const mgr = await Manager.findOne({ userId: actor._id }).select("managedDepartments").lean();
            const ids = mgr?.managedDepartments || [];
            if (ids.length === 0) {
                departments = [];
            } else {
                departments = await Department.find({ _id: { $in: ids }, isActive: true }).sort({ name: 1 });
            }
        } else {
            departments = await Department.find({ isActive: true }).sort({ name: 1 });
        }

        return NextResponse.json({ departments }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch departments", details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await DBConnect();
        const session = await getSession();
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { name, description } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Department name is required." }, { status: 400 });
        }

        const newDepartment = new Department({ name, description });
        await newDepartment.save();

        return NextResponse.json({ department: newDepartment, message: "Department created successfully!" }, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: "Department with this name already exists." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create department", details: error.message }, { status: 500 });
    }
}
