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
        const bookingId = event.data.bookingId;

        // If payment is already completed when this function starts, exit early.
        const existingBooking = await Booking.findById(bookingId);
        if (!existingBooking || existingBooking.isPaid) {
            return;
        }

        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
        await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);

        await step.run('check-payment-status', async () => {
            const booking = await Booking.findById(bookingId);

            // If booking is missing or already paid by the time we check, do nothing.
            if (!booking || booking.isPaid) {
                return;
            }

            const show = await Show.findById(booking.show);
            booking.bookedSeats.forEach((seat) => {
                delete show.occupiedSeats[seat];
            });
            show.markModified('occupiedSeats');
            await show.save();
            await Booking.findByIdAndDelete(booking._id);
        });
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

        if (!booking) {
            console.log('send-booking-confirmation-email: booking not found', { bookingId });
            return;
        }

        await step.run('send-booking-confirmation-email', async () => {
            await sendEmail({
                to: booking.user.email,
                subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
                body: `
                <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                  <h2>Hi ${booking.user.name || booking.user.email},</h2>
                  <p>Your booking for <strong style="color: #F84565;">${booking.show.movie.title}</strong> is confirmed.</p>
                  <p>
                    <strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}<br/>
                    <strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kathmandu' })}
                  </p>
                  <p>Please arrive 10 minutes before the show.</p>
                  <p>Enjoy the show!</p>
                  <p>Thanks for booking with us!<br/> ShowTimeX Team</p>
                </div>
            `
            })
        });
    }
)

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdate, releaseSeatsandDeleteBooking, sendBookingConfirmationEmail];