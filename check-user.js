const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const db = new PrismaClient();

async function main() {
  const user = await db.user.findUnique({ where: { email: "demo@routeready.app" } });
  if (!user) {
    console.log("NO USER FOUND");
    return;
  }
  console.log("User:", user.email);
  console.log("Has password:", !!user.password);
  console.log("Password value:", user.password ? user.password.substring(0, 10) + "..." : "null");
  console.log("Role:", user.role);
  console.log("BusinessId:", user.businessId);

  if (user.password) {
    const valid = await bcrypt.compare("demo123", user.password);
    console.log("Password 'demo123' valid:", valid);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
