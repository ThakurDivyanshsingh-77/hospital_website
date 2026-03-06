const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const connectDb = require("./config/db");
const { Department, User, sequelize } = require("./models");
const defaultDepartments = require("./data/defaultDepartments");

const seed = async () => {
  await connectDb();
  await sequelize.sync();

  for (const item of defaultDepartments) {
    await Department.findOrCreate({
      where: { name: item.name },
      defaults: {
        name: item.name,
        description: item.description,
        icon: item.icon,
        isActive: true,
      },
    });
  }

  const adminEmail = String(process.env.SEED_ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
  const adminPassword = String(process.env.SEED_ADMIN_PASSWORD || "");
  const adminName = String(process.env.SEED_ADMIN_NAME || "CareConnect Admin");
  if (adminEmail && adminPassword.length >= 6) {
    const existing = await User.findOne({ where: { email: adminEmail } });
    if (!existing) {
      const passwordHash = await User.hashPassword(adminPassword);
      await User.create({
        fullName: adminName,
        email: adminEmail,
        passwordHash,
        role: "admin",
      });
      console.log(`Seeded admin user: ${adminEmail}`);
    }
  }

  console.log("Seed complete.");
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
