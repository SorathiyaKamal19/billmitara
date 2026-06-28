import { connectDB } from './config/db.js';
import { ensureSuperadmin } from './services/superadminService.js';

async function createSuperadmin() {
  await connectDB();
  const user = await ensureSuperadmin();
  console.log(`Superadmin ready: ${user.email}`);
  process.exit(0);
}

createSuperadmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
