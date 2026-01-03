import { connectDB } from "./db";
import { Inventory } from "./models/index";

const PPF_CATEGORIES = {
  "Elite": { "car": { "5yr": 55000, "7yr": 65000 }, "bike": { "5yr": 12000, "7yr": 15000 } },
  "Garware Matt": { "car": { "3yr": 75000, "5yr": 85000 }, "bike": { "3yr": 18000, "5yr": 22000 } },
  "Garware Plus": { "car": { "3yr": 60000, "5yr": 70000 }, "bike": { "3yr": 15000, "5yr": 18000 } },
  "Garware Premium": { "car": { "3yr": 90000, "5yr": 105000 }, "bike": { "3yr": 25000, "5yr": 30000 } }
};

async function seed() {
  try {
    await connectDB();
    console.log("Connected to MongoDB for seeding...");

    for (const name of Object.keys(PPF_CATEGORIES)) {
      const exists = await Inventory.findOne({ name, category: { $ne: 'Accessories' } });
      if (!exists) {
        await Inventory.create({
          name,
          category: 'PPF',
          quantity: 0,
          unit: 'rolls',
          price: 0,
          minStock: 1
        });
        console.log(`Created PPF Category: ${name}`);
      } else {
        console.log(`PPF Category already exists: ${name}`);
      }
    }

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
