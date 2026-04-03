import { NextResponse } from "next/server";
import Department from "@/models/department";
import DBConnect from "../../../../lib/DB_Connect";

export async function GET() {
    try {
        await DBConnect();
        const departments = await Department.find({ isActive: true }).sort({ name: 1 });
        return NextResponse.json({ departments }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch departments", details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await DBConnect();
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
