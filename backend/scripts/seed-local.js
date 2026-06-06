require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('../src/models/User');
const Category = require('../src/models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Technology', description: 'Tech news, tutorials, and product reviews' },
  { name: 'Health', description: 'Health, fitness, and wellness' },
  { name: 'Business', description: 'Business, startups, and finance' },
  { name: 'Lifestyle', description: 'Lifestyle, culture, and personal growth' },
  { name: 'Education', description: 'Learning, courses, and study tips' },
  { name: 'Science', description: 'Science discoveries and research' },
  { name: 'Travel', description: 'Travel guides and destinations' },
  { name: 'Food', description: 'Recipes, restaurants, and cooking' },
  { name: 'Sports', description: 'Sports news and analysis' },
  { name: 'Entertainment', description: 'Movies, music, and pop culture' },
];

const DEV_ADMIN = {
  name: 'Local Admin',
  email: 'admin@local.dev',
  password: 'admin123456',
  role: 'admin',
};

async function seed() {
  const mongoUri = process.env.MONGO_URI?.trim();
  if (!mongoUri) {
    console.error('MONGO_URI is not set in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(`Connected to ${mongoose.connection.name}`);

  let categoriesCreated = 0;
  for (const item of DEFAULT_CATEGORIES) {
    const slug = slugify(item.name, { lower: true, strict: true });
    const existing = await Category.findOne({ name: item.name });
    if (!existing) {
      await Category.create({ name: item.name, slug, description: item.description });
      categoriesCreated += 1;
    }
  }
  console.log(`Categories: ${categoriesCreated} created, ${DEFAULT_CATEGORIES.length - categoriesCreated} already existed`);

  let admin = await User.findOne({ email: DEV_ADMIN.email });
  if (!admin) {
    await User.create(DEV_ADMIN);
    console.log(`Dev admin created — ${DEV_ADMIN.email} / ${DEV_ADMIN.password}`);
  } else if (admin.role !== 'admin') {
    admin.role = 'admin';
    await admin.save();
    console.log(`Promoted ${DEV_ADMIN.email} to admin`);
  } else {
    console.log(`Dev admin already exists: ${DEV_ADMIN.email}`);
  }

  await mongoose.disconnect();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
