import { Schema, model } from "mongoose";

const countrySchema = new Schema({
  _id: { type: Number, required: true, match: /^[1-9]{1, 3}$/},
  countryISO3: { type: String, required: true, minlength: 3, maxlength: 3, match: /^[A-Z]{3}$/ },
  countryISO2: { type: String, required: true, minlength: 2, maxlength: 2, match: /^[A-Z]{2}$/ },
  countryFull: { type: String, required: true }
});

export default model("Country", countrySchema);