import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/db.config.js';

const app = express()
const port = 3000;

await connectDB()

//middleware
app.use(express.json())
app.use(cors())

//Api routes
app.get('/', (req, res)=> res.send("Server is live!"))

app.listen(port, ()=> console.log(`Server listening at http://localhost:${port}`))