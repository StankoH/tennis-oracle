import mongoose from "mongoose";
import { schema as playerSchema } from "./player.model.js";

export default mongoose.model("PlayerWTA", playerSchema, "playerswta");