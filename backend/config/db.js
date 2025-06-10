import { connect } from "mongoose";

const connectDB = async () => {
    try {
        await connect(process.env.MONGO_URI);
        console.log("MongoDB connected ✅");
    } catch (err) {
        console.error("MongoDB connection failed ❌", err.message);
        process.exit(1);
    }
};

export default connectDB;