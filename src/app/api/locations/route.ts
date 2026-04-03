import { NextResponse } from "next/server";
import Location from "@/models/location";
import DBConnect from "../../../../lib/DB_Connect";

export async function GET() {
    try {
        await DBConnect();
        const locations = await Location.find({ isActive: true }).sort({ name: 1 });
        return NextResponse.json({ locations }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch locations", details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await DBConnect();
        const { name, address } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Location name is required." }, { status: 400 });
        }

        const newLocation = new Location({ name, address });
        await newLocation.save();

        return NextResponse.json({ location: newLocation, message: "Location created successfully!" }, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: "Location with this name already exists." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create location", details: error.message }, { status: 500 });
    }
}
