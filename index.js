import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"

const app = express();

dotenv.config();

const PORT  = process.env.PORT || 7000;
const MONGOURL = process.env.MONGO_URL;

mongoose.connect(MONGOURL).then(
    ()=>{console.log("database connected successfully");
        app.listen(PORT, () =>{
            console.log('server running on port ${PORT}');
        });
    }
).catch((error) => console.log(error));

