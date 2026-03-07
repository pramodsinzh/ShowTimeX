import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
    try {
        const auth = req.auth();
        if (!auth || !auth.userId) {
            return res.json({ success: false, error: "Authentication required" })
        }
        const { userId } = auth;
        const user = await clerkClient.users.getUser(userId)
        if (user.privateMetadata.role !== 'admin') {
            return res.json({ success: false, error: "Not authorized" })
        }
        next()
    } catch (error) {
        return res.json({ success: false, error: error.message })
    }
}