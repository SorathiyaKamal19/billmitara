import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { MenuItem } from './models/MenuItem.js';
import { Restaurant } from './models/Restaurant.js';
import { Table } from './models/Table.js';
import { User } from './models/User.js';

const menu = [
  ['Paneer Pizza', 'Pizza', 249, 'veg'],
  ['Farmhouse Pizza', 'Pizza', 299, 'veg'],
  ['Chicken Burger', 'Burgers', 189, 'non-veg'],
  ['Veg Cheese Burger', 'Burgers', 149, 'veg'],
  ['Hakka Noodles', 'Chinese', 179, 'veg'],
  ['Chilli Paneer', 'Chinese', 229, 'veg'],
  ['Cold Coffee', 'Beverages', 119, 'veg'],
  ['Masala Tea', 'Beverages', 49, 'veg'],
  ['Brownie Sundae', 'Desserts', 159, 'egg'],
  ['Garlic Bread', 'Pizza', 129, 'veg']
];

async function seed() {
  await connectDB();
  const restaurant = await Restaurant.findOneAndUpdate(
    { name: 'POSS Restaurant' },
    {
      name: 'POSS Restaurant',
      address: 'MG Road, Bengaluru',
    phone: '+919999999999',
    gstNumber: '29ABCDE1234F1Z5',
    gstEnabled: true,
    gstRate: 5,
    takeawayChargeEnabled: true,
    takeawayCharge: 10,
    qrMenuUrl: 'https://example.com/poss-menu'
    },
    { new: true, upsert: true }
  );
  const users = [
    { name: env.seed.superadminName, email: env.seed.superadminEmail, password: env.seed.superadminPassword, role: 'superadmin', phone: env.seed.superadminPhone },
    { name: 'Owner Demo', email: env.seed.ownerEmail, password: env.seed.ownerPassword, role: 'owner', restaurant: restaurant._id, phone: '+919999999001' },
    { name: 'Manager Demo', email: 'manager@poss.local', password: 'Password@123', role: 'manager', restaurant: restaurant._id, phone: '+919999999002' },
    { name: 'Waiter Demo', email: 'waiter@poss.local', password: 'Password@123', role: 'waiter', restaurant: restaurant._id, phone: '+919999999003' },
    { name: 'Chef Demo', email: 'chef@poss.local', password: 'Password@123', role: 'chef', restaurant: restaurant._id, phone: '+919999999004' }
  ];
  for (const user of users) {
    const existing = await User.findOne({ email: user.email });
    if (!existing) await User.create(user);
  }
  for (const [name, category, price, foodType] of menu) {
    const code = name.split(' ').map((part) => part[0]).join('').toUpperCase() + String(price).slice(0, 2);
    await MenuItem.findOneAndUpdate(
      { restaurant: restaurant._id, name },
      { restaurant: restaurant._id, name, code, category, price, foodType, imageUrl: `https://source.unsplash.com/600x400/?${encodeURIComponent(name)},food` },
      { upsert: true }
    );
  }
  for (const table of Array.from({ length: 12 }, (_, index) => ({ restaurant: restaurant._id, name: `Table ${index + 1}`, capacity: index % 3 === 0 ? 6 : 4, zone: index < 8 ? 'Main Floor' : 'Patio' }))) {
    await Table.findOneAndUpdate({ restaurant: restaurant._id, name: table.name }, table, { upsert: true });
  }
  console.log('Seed complete');
  console.log(`Superadmin: ${env.seed.superadminEmail} / ${env.seed.superadminPassword}`);
  console.log(`Owner: ${env.seed.ownerEmail} / ${env.seed.ownerPassword}`);
  console.log('Manager: manager@poss.local / Password@123');
  console.log('Waiter: waiter@poss.local / Password@123');
  console.log('Chef: chef@poss.local / Password@123');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
