import e from "express";
import { getFavorites, getUsersBookings, updateFavorite } from "../controllers/userController.js";

const userRouter = e.Router()

userRouter.get('/bookings', getUsersBookings)
userRouter.post('/update-favorite', updateFavorite)
userRouter.get('/favorites', getFavorites)

export default userRouter;