import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.config.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

//Inngest functions to manage user authentication and authorization
//create user
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        const { id, email_addresses, image_url, first_name, last_name } = event.data;
        const userDate = {
            _id: id,
            name: `${first_name} ${last_name}`,
            email: email_addresses[0].email_address,
            image: image_url,
        }
        await User.create(userDate);
    }
)
//update user
const syncUserUpdate = inngest.createFunction(
    { id: 'update-user-from-clerk' },
    { event: 'clerk/user.updated' },
    async ({ event }) => {
        const { id, email_addresses, image_url, first_name, last_name } = event.data;
        const userDate = {
            _id: id,
            name: `${first_name} ${last_name}`,
            email: email_addresses[0].email_address,
            image: image_url,
        }
        await User.findByIdAndUpdate(id, userDate);
    }
)
//delete user
const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-with-clerk' },
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        const { id } = event.data;
        await User.findByIdAndDelete(id)
    }
)

//function to cancel booking and release seats of show after 10 minutes of booking created if payment is not done
const releaseSeatsandDeleteBooking = inngest.createFunction(
    { id: 'release-seats-delete-booking' },
    { event: 'app/checkpayment' },
    async ({ event, step }) => {
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
        await step.sleepUntil('wait-for-10-minutes', tenMinutesLater)

        await step.run('check-payment-status', async () => {
            const bookingId = event.data.bookingId;
            const booking = await Booking.findById(bookingId)

            //if payment is not made, release seats and delete booking
            if (!booking.isPaid) {
                const show = await Show.findById(booking.show)
                booking.bookedSeats.forEach((seat) => {
                    delete show.occupiedSeats[seat]
                })
                show.markModified('occupiedSeats')
                await show.save()
                await Booking.findByIdAndDelete(booking._id)
            }
        })
    }
)

//Inngest function to send email when user books a show
const sendBookingConfirmationEmail = inngest.createFunction(
    { id: 'send-booking-confirmation-email' },
    { event: 'app/show.booked' },
    async ({ event, step }) => {
        const { bookingId } = event.data;

        const booking = await Booking.findById(bookingId).populate({
            path: "show",
            populate: { path: "movie", model: "Movie" }
        }).populate("user");

        await sendEmail({
            to: booking.user.email,
            subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
            body: `
                <div style="font-family: Arial, sans-serif; background: #fafbfc; padding: 32px 0;">
                  <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 10px; box-shadow: 0 4px 12px rgba(20,30,40,0.08); padding: 32px;">
                    <div style="text-align:center;">
                      <h2 style="color: #262626; margin-bottom: 16px; font-size: 28px;">Booking Confirmed 🎉</h2>
                      <p style="color: #444; margin: 0 0 24px; font-size: 18px;"><b>${booking.user.name || booking.user.email}</b>, thank you for booking!</p>
                    </div>
                    <div style="background: #f4f7fb; border-radius: 8px; padding: 18px 20px; margin-bottom: 22px;">
                      <h3 style="margin: 0 0 10px; color: #334;">${booking.show.movie.title}</h3>
                      <p style="margin: 0; color: #666;">Show Time: <b>${new Date(booking.show.showDateTime).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}</b></p>
                      <p style="margin: 4px 0 0; color: #666;">Seats: <b>${booking.bookedSeats.join(', ')}</b></p>
                    </div>
                    <p style="margin: 28px 0 0; color: #7c7c7c; font-size: 15px;">
                      Please arrive 10 minutes before the show. <br/>
                      Enjoy your movie!
                    </p>
                    <hr style="margin: 28px 0; border: none; border-top: 1px solid #eee;" />
                    <p style="text-align:center; margin: 0; color: #b0b0b0; font-size: 13px;">
                      This is an automated confirmation for your records.<br/>
                      &copy; ${new Date().getFullYear()} ShowtimeX
                    </p>
                  </div>
                </div>
            `
        })
    }
)

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdate, releaseSeatsandDeleteBooking, sendBookingConfirmationEmail];