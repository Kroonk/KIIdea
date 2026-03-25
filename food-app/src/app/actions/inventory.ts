"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from './auth'

export async function getInventory() {
  const user = await requireAuth()
  try {
    return await prisma.inventory.findMany({
      where: { userId: user.id },
      include: {
        item: true
      },
      orderBy: {
        item: { name: 'asc' }
      }
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return []
  }
}

export async function searchItems(query: string) {
  if (!query || query.length < 2) return []
  return await prisma.item.findMany({
    where: {
      name: { contains: query }
    },
    take: 10
  })
}

export async function addToInventory(itemId: string, quantity: number) {
  const user = await requireAuth()
  const existing = await prisma.inventory.findFirst({
    where: { itemId, userId: user.id }
  })

  if (existing) {
    await prisma.inventory.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity }
    })
  } else {
    await prisma.inventory.create({
      data: { itemId, quantity, userId: user.id }
    })
  }
  revalidatePath('/inventory')
}

export async function updateInventory(id: string, quantity: number, unit?: string) {
  const user = await requireAuth()

  // Verify ownership
  const inv = await prisma.inventory.findFirst({
    where: { id, userId: user.id },
    select: { itemId: true }
  })
  if (!inv) return

  if (unit) {
    await prisma.item.update({
      where: { id: inv.itemId },
      data: { unit }
    })
  }

  await prisma.inventory.update({
    where: { id },
    data: { quantity }
  })
  revalidatePath('/inventory')
  revalidatePath('/')
}

export async function removeFromInventory(id: string, quantityToRemove?: number) {
  const user = await requireAuth()

  // Verify ownership
  const inv = await prisma.inventory.findFirst({
    where: { id, userId: user.id }
  })
  if (!inv) return

  if (quantityToRemove && inv.quantity > quantityToRemove) {
    await prisma.inventory.update({
      where: { id },
      data: { quantity: inv.quantity - quantityToRemove }
    })
    revalidatePath('/inventory')
    return
  }

  await prisma.inventory.delete({ where: { id } })
  revalidatePath('/inventory')
  revalidatePath('/')
}

export async function handleBarcodeScan(barcode: string) {
  // 1. Check local DB
  let item = await prisma.item.findUnique({
    where: { barcode }
  })

  let suggestedQuantity = 1

  // 2. Not found locally, fetch from OpenFoodFacts
  if (!item) {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
      const data = await res.json()

      if (data.status === 1 && data.product) {
        const title = data.product.product_name_de || data.product.product_name || `Unbekanntes Produkt (${barcode})`
        const category = data.product.categories_hierarchy ? data.product.categories_hierarchy[0]?.split(':').pop() : 'Allgemein'

        // Extrahiere Packungsgröße (z.B. "500 g", "1 l", "250 ml")
        let unit = 'Stück'
        const quantity = data.product.quantity || ''

        // Parse quantity string (z.B. "500 g" -> unit: "Gramm", suggestedQuantity: 500)
        const qtyMatch = quantity.match(/^([\d.,]+)\s*([a-zA-Zµ]+)/)
        if (qtyMatch) {
          const amount = parseFloat(qtyMatch[1].replace(',', '.'))
          const unitStr = qtyMatch[2].toLowerCase()

          if (unitStr === 'g' || unitStr.includes('gram')) {
            unit = 'Gramm'
            suggestedQuantity = amount
          } else if (unitStr === 'kg') {
            unit = 'Gramm'
            suggestedQuantity = amount * 1000
          } else if (unitStr === 'ml' || unitStr === 'cl' || unitStr === 'l') {
            unit = 'ml'
            if (unitStr === 'l') suggestedQuantity = amount * 1000
            else if (unitStr === 'cl') suggestedQuantity = amount * 10
            else suggestedQuantity = amount
          } else {
            unit = 'Stück'
            suggestedQuantity = amount
          }
        }

        // Save to local DB
        item = await prisma.item.create({
          data: {
            name: title,
            barcode,
            unit: unit,
            category: category
          }
        })
      }
    } catch (e) {
      console.error("OpenFoodFacts Error:", e)
    }
  }

  // 3. Return item info (don't add to inventory yet - dialog will do that)
  if (item) {
    return {
      success: true,
      item: {
        id: item.id,
        name: item.name,
        unit: item.unit
      },
      suggestedQuantity
    }
  }

  return { success: false, message: 'Produkt nicht gefunden. Bitte manuell hinzufügen.' }
}
