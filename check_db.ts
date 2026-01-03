import { Inventory } from './server/models';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI not found");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const item = await Inventory.findOne({ name: 'Elite' });
  if (item) {
    console.log("Found item:", item.name);
    console.log("Total quantity field:", item.quantity);
    console.log("Rolls count:", item.rolls?.length);
    item.rolls?.forEach((r: any, i: number) => {
      console.log(`Roll ${i}: ${r.name}, Remaining Sqft: ${r.remaining_sqft}, Status: ${r.status}`);
    });
  } else {
    console.log("Item 'Elite' not found");
  }
  await mongoose.disconnect();
}

check().catch(console.error);
