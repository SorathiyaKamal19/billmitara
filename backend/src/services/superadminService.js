import { env } from '../config/env.js';
import { User } from '../models/User.js';

function required(value, name) {
  if (!value || !String(value).trim()) {
    throw new Error(`${name} is required`);
  }
  return String(value).trim();
}

export async function ensureSuperadmin() {
  const name = required(env.seed.superadminName, 'SEED_SUPERADMIN_NAME');
  const email = required(env.seed.superadminEmail, 'SEED_SUPERADMIN_EMAIL').toLowerCase();
  const phone = required(env.seed.superadminPhone, 'SEED_SUPERADMIN_PHONE');
  const password = required(env.seed.superadminPassword, 'SEED_SUPERADMIN_PASSWORD');

  if (password.length < 8) {
    throw new Error('SEED_SUPERADMIN_PASSWORD must be at least 8 characters');
  }

  let user = await User.findOne({ email }).select('+password');
  if (!user) {
    user = await User.findOne({ phone }).select('+password');
  }

  if (!user) {
    user = new User({ name, email, phone });
  }

  user.name = name;
  user.email = email;
  user.phone = phone;
  user.role = 'superadmin';
  user.restaurant = undefined;
  user.isActive = true;
  user.isSubscribed = true;
  user.password = password;

  await user.save();

  return user;
}
