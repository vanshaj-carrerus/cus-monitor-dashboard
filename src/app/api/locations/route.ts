import { NextResponse } from "next/server";
import Location from "@/models/location";
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

        let locations;
        if (actor.role === "manager") {
            const mgr = await Manager.findOne({ userId: actor._id }).select("managedLocations").lean();
            const ids = mgr?.managedLocations || [];
            if (ids.length === 0) {
                locations = [];
            } else {
                locations = await Location.find({ _id: { $in: ids }, isActive: true }).sort({ name: 1 });
            }
        } else {
            locations = await Location.find({ isActive: true }).sort({ name: 1 });
        }

        return NextResponse.json({ locations }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch locations", details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await DBConnect();
        const session = await getSession();
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

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
