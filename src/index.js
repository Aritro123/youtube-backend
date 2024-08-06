import dotenv from "dotenv"
import connectDB from "../src/db/index.js";
import { app } from "./app.js";


dotenv.config({
    path: '.env'
})


connectDB()
.then(()=>{
    app.on('error',(err) => console.log(`ERRRR: ${err}`));
    
    app.listen(process.env.PORT || 3000, ()=>{
        console.log(`Server listening on ${process.env.PORT}`);
        
    })
})
.catch((err) => {
console.log(`Failed to connect DataBase ${err}`)
})