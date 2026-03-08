import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/db.config.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from 'inngest/express'
import { inngest, functions } from './inngest/index.js';
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';



const app = express()
const port = 3000;

await connectDB()

//middleware
app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())



//Api routes
app.get('/', (req, res) => res.send("Server is live!"))
app.use('/api/inngest', serve({ client: inngest, functions }))

//Movies route
app.use('/api/show', showRouter)

//Booking route
app.use('/api/booking', bookingRouter)

//Admin Route
app.use('/api/admin', adminRouter)

app.listen(port, () => console.log(`Server listening at http://localhost:${port}`))