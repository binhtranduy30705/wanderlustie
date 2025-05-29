import mongoose from "mongoose";
import PackageModel from "./models/package"; // adjust the path if needed

console.log("🚀 Seeding script started...");

const seedPackages = [
  {
    packageName: "Japan Sakura Tour",
    destination: "Japan",
    tags: ["sakura", "photography", "spring", "cherry blossom"],
    description: "Witness Japan's iconic cherry blossoms with guided cultural tours.",
    priceRange: "$2000–$3000",
    tripType: "Couple",
    availableDates: [{ start: new Date("2025-03-20"), end: new Date("2025-04-05") }],
    imageUrl: "https://example.com/sakura.jpg"
  },
  {
    packageName: "Bali Digital Detox Retreat",
    destination: "Bali",
    tags: ["wellness", "beach", "nature", "meditation"],
    description: "Unplug and recharge with yoga, meditation, and nature hikes.",
    priceRange: "$1000–$1500",
    tripType: "Solo",
    availableDates: [{ start: new Date("2025-08-01"), end: new Date("2025-08-07") }],
    imageUrl: "https://example.com/bali-retreat.jpg"
  },
  {
    packageName: "Europe Rail Adventure",
    destination: "Europe",
    tags: ["adventure", "multi-country", "budget", "train travel"],
    description: "Explore 5 European cities in 10 days by train.",
    priceRange: "$1500–$2500",
    tripType: "Group",
    availableDates: [{ start: new Date("2025-06-15"), end: new Date("2025-06-25") }],
    imageUrl: "https://example.com/europe-rail.jpg"
  },
  {
    packageName: "Maldives Honeymoon Getaway",
    destination: "Maldives",
    tags: ["beach", "luxury", "romantic", "honeymoon"],
    description: "Overwater villa with candlelit dinners and spa packages.",
    priceRange: "$3000–$5000",
    tripType: "Couple",
    availableDates: [{ start: new Date("2025-02-01"), end: new Date("2025-02-07") }],
    imageUrl: "https://example.com/maldives.jpg"
  },
  {
    packageName: "Vietnam Street Food Trail",
    destination: "Vietnam",
    tags: ["food", "culture", "local", "budget"],
    description: "Taste your way through Hanoi, Hue, and Saigon.",
    priceRange: "< $1000",
    tripType: "Solo",
    availableDates: [{ start: new Date("2025-11-01"), end: new Date("2025-11-10") }],
    imageUrl: "https://example.com/vietnam-food.jpg"
  },
  {
    packageName: "Swiss Alps Family Adventure",
    destination: "Switzerland",
    tags: ["snow", "family", "outdoor", "skiing"],
    description: "Skiing, sledding and scenic train rides in the Alps.",
    priceRange: "$3000–$4000",
    tripType: "Family",
    availableDates: [{ start: new Date("2025-12-15"), end: new Date("2025-12-25") }],
    imageUrl: "https://example.com/swiss-family.jpg"
  },
  {
    packageName: "Tokyo Anime & Pop Culture Tour",
    destination: "Japan",
    tags: ["anime", "pop culture", "urban", "shopping"],
    description: "Visit Akihabara, Studio Ghibli Museum, and themed cafes.",
    priceRange: "$1500–$2500",
    tripType: "Group",
    availableDates: [{ start: new Date("2025-10-10"), end: new Date("2025-10-16") }],
    imageUrl: "https://example.com/tokyo-anime.jpg"
  },
  {
    packageName: "Iceland Northern Lights Hunt",
    destination: "Iceland",
    tags: ["nature", "photography", "winter", "aurora"],
    description: "Chase the Northern Lights with expert local guides.",
    priceRange: "$2500–$3500",
    tripType: "Solo",
    availableDates: [{ start: new Date("2025-01-05"), end: new Date("2025-01-12") }],
    imageUrl: "https://example.com/iceland-lights.jpg"
  },
  {
    packageName: "Thailand Island Hopping",
    destination: "Thailand",
    tags: ["beach", "budget", "party", "tropical"],
    description: "Explore Phi Phi, Krabi, and Koh Samui by boat.",
    priceRange: "$1000–$2000",
    tripType: "Group",
    availableDates: [{ start: new Date("2025-07-01"), end: new Date("2025-07-10") }],
    imageUrl: "https://example.com/thailand-islands.jpg"
  },
  {
    packageName: "New Zealand Adventure Road Trip",
    destination: "New Zealand",
    tags: ["road trip", "nature", "hiking", "scenery"],
    description: "14-day self-drive itinerary with lakes, mountains, and trails.",
    priceRange: "$3000–$4500",
    tripType: "Family",
    availableDates: [{ start: new Date("2025-09-01"), end: new Date("2025-09-15") }],
    imageUrl: "https://example.com/nz-roadtrip.jpg"
  }
];

mongoose
  .connect("mongodb+srv://trangthuy2296:edqod26HIeTgpTme@wanderlustie.3ddvjbw.mongodb.net/?retryWrites=true&w=majority&appName=wanderlustie") // Replace with your DB URI
  .then(async () => {
    await PackageModel.deleteMany(); // Clear old data
    await PackageModel.insertMany(seedPackages);
    console.log("✅ Packages seeded successfully");
    process.exit();
  })
  .catch((err) => {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  });
