import mongoose from "mongoose";
import connectDB from '../config/db';
connectDB();

// Mongoose Schema
const userSchema = new mongoose.Schema({
  psid: { type: String, required: true, unique: true }, // Messenger PSID
  fbId: String,
  firstName: String,
  lastName: String,
  messengerName: String,
  locale: String,
  timezone: String,
  gender: String,

  // Travel Profile Fields
  occupation: String,                    // e.g. "Student", "HR Manager"
  travelInterests: [String],            // e.g. ["Photography", "Food"]
  budgetRange: String,                  // e.g. "<$1000", "$2000–$3000"
  tripType: String,                     // e.g. "Couple", "Family"
  preferredDestinations: [String],      // e.g. ["Japan", "Europe"]
  travelSeason: String,                 // e.g. "June holidays", "Year-end"

  // Past Bookings
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],

  // Optional for personalization/targeting
  tags: [String],
  lastInteracted: Date,
  profileCompleted: { type: Boolean, default: false }
});

const UserModel = mongoose.model("User", userSchema);

export default class User {
  psid: string;
  fbId?: string;
  firstName: string;
  lastName: string;
  messengerName?: string;
  locale: string;
  timezone: string;
  gender: string;

  occupation?: string;
  travelInterests?: string[];
  budgetRange?: string;
  tripType?: string;
  preferredDestinations?: string[];
  travelSeason?: string;

  tags?: string[];
  lastInteracted?: Date;
  profileCompleted?: boolean;

  constructor(psid: string) {
    this.psid = psid;
    this.firstName = "";
    this.lastName = "";
    this.locale = "en_US";
    this.timezone = "";
    this.gender = "neutral";
  }

  setProfile(profile: Partial<User>): void {
    Object.assign(this, profile);
  }

  static async findOne(query: { where: { fbId: string } }): Promise<User | null> {
  const data = await UserModel.findOne({ fbId: query.where.fbId });
  if (!data) return null;

  const user = new User(data.psid);
  Object.assign(user, data.toObject());
  return user;
  }

  static async create(data: {
  psid: string; 
  fbId: string; 
  firstName?: string; 
  lastName?: string; 
  messengerName?: string; 
  locale?: string; 
  timezone?: string; 
  gender?: string; }): Promise<User> {
    const newUser = new UserModel(data);
    await newUser.save();

    const user = new User(data.fbId);
    Object.assign(user, newUser.toObject());
    return user;
  }

  async saveToDB() {
    const existing = await UserModel.findOne({ psid: this.psid });
    const data = { ...this };
    if (existing) {
      await UserModel.updateOne({ psid: this.psid }, data);
    } else {
      await new UserModel(data).save();
    }
  }

  static async loadFromDB(psid: string): Promise<User | null> {
    const data = await UserModel.findOne({ psid });
    if (!data) return null;

    const user = new User(psid);
    Object.assign(user, data.toObject());
    return user;
  }
}
