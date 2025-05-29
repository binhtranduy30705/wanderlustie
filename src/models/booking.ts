import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  packageName: { type: String, required: true }, // e.g. "Japan Sakura Tour"
  destination: String, // e.g. "Japan"
  startDate: Date,
  endDate: Date,

  bookingDate: { type: Date, default: Date.now }, // when user confirmed the booking
  price: Number,
  groupSize: Number, // e.g. 2 for couples, 5 for family
  tripType: String, // e.g. "Couple", "Family", "Solo"
  interestsTagged: [String], // e.g. ["Photography", "Food"]

  notes: String, // freeform notes from user or agent
  status: { type: String, enum: ["confirmed", "cancelled", "completed", "pending"], default: "pending" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

bookingSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
