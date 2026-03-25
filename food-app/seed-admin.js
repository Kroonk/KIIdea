// Seed admin user on first boot (runs before Next.js server starts)
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || "file:/app/data/dev.db" } }
})

async function seedAdmin() {
  const userCount = await prisma.user.count()
  if (userCount > 0) {
    console.log("Users already exist, skipping admin seed.")
    return
  }

  const hash = await bcrypt.hash("Testpw123", 12)
  await prisma.user.create({
    data: {
      username: "MrDiderot",
      password: hash,
      role: "admin"
    }
  })
  console.log("Admin user 'MrDiderot' created successfully.")
}

seedAdmin()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Admin seed failed:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
