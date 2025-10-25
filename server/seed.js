const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);

  const organizer = await prisma.user.upsert({
    where: { email: "reyhan@mail.com" },
    update: {},
    create: {
      name: "Reyhan",
      email: "reyhan@mail.com",
      password: hashedPassword,
      role: "ORGANIZER",
      referralCode: "RYH123",
      points: 50000,
    },
  });

}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
