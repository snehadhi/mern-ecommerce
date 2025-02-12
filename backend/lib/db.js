import mongoose from "mongoose";

export const connectDB = async () => {
    try{
      const connect = await mongoose.connect(process.env.MONGO_URI);
      console.log(`mongoDB connected: ${connect.connection.host} `)

    }
     catch(error){
       console.log("error connecting to MONGODB", error.message);
       process.exit(1);
       
     }
}