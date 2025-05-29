import mongoose from "mongoose";

const packageSchema = new mongoose.Schema({
  packageName: { type: String, required: true }, // e.g. "Japan Sakura Tour"
  destination: String,                           // e.g. "Japan"
  tags: [String],                                // e.g. ["sakura", "photography", "spring"]
  description: String,                           // brief package details
  priceRange: String,                            // e.g. "< $1000", "$2000–$3000"
  tripType: String,                              // e.g. "Couple", "Family", "Solo"
  availableDates: [
    {
      start: Date,
      end: Date
    }
  ],
  imageUrl: String,                              // for UI or chatbot display
  isActive: { type: Boolean, default: true }
});

const PackageModel = mongoose.model("Package", packageSchema);
export default PackageModel;
