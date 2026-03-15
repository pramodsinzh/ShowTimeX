import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

//Inngest functions to manage user authentication and authorization
//create user
const syncUserCreation = inngest.createFunction( 
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async({event})=> {
        const {id, email_addresses, image_url, first_name, last_name} = event.data;
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
    async({event})=> {
        const {id, email_addresses, image_url, first_name, last_name} = event.data;
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
    async({event})=> {
        const {id} = event.data;
        await User.findByIdAndDelete(id)
    }
)

//function to cancel booking and release seats of show after 10 minutes of booking created if payment is not done
const releaseSeatsandDeleteBooking = inngest.createFunction(
    {id: 'release-seats-delete-booking'},
    {event: 'app/checkpayment'},
    async({event, step})=> {
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
        await step.sleepUntil('wait-for-10-minutes', tenMinutesLater)

        await step.run('check-payment-status', async()=> {
            const bookingId = event.data.bookingId;
            const booking = await Booking.findById(bookingId)

            //if payment is not made, release seats and delete booking
            if(!booking.isPaid){
                const show = await Show.findById(booking.show)
                booking.bookedSeats.forEach((seat)=> {
                    delete show.occupiedSeats[seat]
                })
                show.markModified('occupiedSeats')
                await show.save()
                await Booking.findByIdAndDelete(booking._id)
            }
        })
    }
)
 
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdate, releaseSeatsandDeleteBooking];