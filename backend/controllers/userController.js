import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js"
import Movie from "../models/Movie.js";

//Function to get user bookings 
export const getUsersBookings = async (req, res) => {
    try {
        const user = req.auth().userId;
        const bookings = await Booking.find({ user }).populate({
            path: "show",
            populate: { path: "movie" }
        }).sort({ createdAt: -1 })

        res.json({ success: true, bookings })
    } catch (error) {
        console.error(error.message)
        res.json({ success: false, message: error.message })
    }
}

//Function to update favorite Movie in the clerk Metadata 
export const updateFavorite = async (req, res) => {
    try {
        const { movieId } = req.body;
        const userId = req.auth().userId;

        const user = await clerkClient.users.getUser(userId)

        if (!user.privateMetadata.favorites) {
            user.privateMetadata.favorites = []
        }
        if (!user.privateMetadata.favorites.includes(movieId)) {
            user.privateMetadata.favorites.push(movieId)
        } else {
            user.privateMetadata.favorites = user.privateMetadata.favorites.filter(item => item !== movieId)
        }
        await clerkClient.users.updateUserMetadata(userId, { privateMetadata: user.privateMetadata })

        res.json({ success: true, message: "Favorite added updated!" })
    } catch (error) {
        console.error(error.message)
        res.json({ success: false, message: error.message })
    }
}

//Function to get favorite movies from database
export const getFavorites = async (req, res) => {
    try {
        const userId = req.auth().userId;
        const user = await clerkClient.users.getUser(userId)
        const favorites = user.privateMetadata.favorites

        //Getting from db
        const movies = await Movie.find({ _id: { $in: favorites } })

        res.json({ success: true, movies })
    } catch (error) {
        console.error(error.message)
        res.json({ success: false, message: error.message })
    }
}