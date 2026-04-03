import User from "@/models/user";
import DBConnect from "./DB_Connect";

/**
 * Global utility to fetch the user's name (username) from their ID.
 * This should be used on the server side (API routes, Server Components, Server Actions).
 * 
 * @param userId - The ID string of the user
 * @returns The username string or "Unknown User"
 */
export async function getUserNameFromId(userId: string): Promise<string> {
    try {
        await DBConnect();
        
        // userId could be a string "ObjectId" or a username
        // ActivityLog.userId is typically the ID but let's be safe
        const user = await User.findById(userId).select("username").lean();
        
        if (user) {
            return (user as any).username;
        }

        // Check if userId is already the username
        const userByUsername = await User.findOne({ username: userId }).select("username").lean();
        if (userByUsername) {
            return (userByUsername as any).username;
        }

        return `User (${userId.slice(-6)})`;
    } catch (error) {
        console.error("Error in getUserNameFromId:", error);
        return "Unknown User";
    }
}
