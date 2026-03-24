import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const defaults = [
    { name: 'Milch (Vollmilch)', unit: 'Liter', category: 'Milchprodukt' },
    { name: 'Eier', unit: 'Stück', category: 'Milchprodukt/Eier' },
    { name: 'Mehl (Weizen)', unit: 'Gramm', category: 'Backzutat' },
    { name: 'Zucker', unit: 'Gramm', category: 'Backzutat' },
    { name: 'Salz', unit: 'Prise', category: 'Gewürz' },
    { name: 'Pfeffer (Schwarz)', unit: 'Prise', category: 'Gewürz' },
    { name: 'Olivenöl', unit: 'ml', category: 'Öl/Essig' },
    { name: 'Zwiebel', unit: 'Stück', category: 'Gemüse' },
    { name: 'Knoblauch', unit: 'Zehe', category: 'Gemüse' },
    { name: 'Kartoffel', unit: 'Gramm', category: 'Gemüse' },
    { name: 'Reis', unit: 'Gramm', category: 'Getreide' },
    { name: 'Nudeln', unit: 'Gramm', category: 'Getreide' },
    { name: 'Tomaten (Passiert)', unit: 'ml', category: 'Konserve' },
    { name: 'Hähnchenbrust', unit: 'Gramm', category: 'Fleisch' },
    { name: 'Butter', unit: 'Gramm', category: 'Milchprodukt' },
    { name: 'Wasser', unit: 'ml', category: 'Getränk' }, // Oft in Rezepten
  ]

  console.log('Start seeding...')

  for (const item of defaults) {
    const createdItem = await prisma.item.upsert({
      where: { name: item.name },
      update: {},
      create: {
        name: item.name,
        unit: item.unit,
        category: item.category,
      },
    })
    console.log(`Created or updated item: ${createdItem.name}`)
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
