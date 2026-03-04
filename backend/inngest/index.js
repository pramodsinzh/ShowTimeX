import { Inngest } from "inngest";
import User from "../models/User";

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

 
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdate];