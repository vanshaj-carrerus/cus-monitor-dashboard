// lib/mongoose.js
import mongoose from "mongoose";

declare global {
    var mongoose:
        | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
        | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable"
    );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents recreating connections every time.
 */
type MongooseCache = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = global as typeof global & {
    mongoose?: MongooseCache;
};

if (!globalWithMongoose.mongoose) {
    globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached: MongooseCache = globalWithMongoose.mongoose;

async function DBConnect() {
    if (cached?.conn) {
        return cached.conn;
    }

    if (!cached?.promise) {
        const opts = {
            bufferCommands: false,
            autoCreate: false,
            autoIndex: false,
        };

        cached.promise = mongoose
            .connect(MONGODB_URI! as string, opts)
            .then((mongooseInstance: typeof mongoose): typeof mongoose => {
                cached.conn = mongooseInstance;
                return mongooseInstance;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default DBConnect;
