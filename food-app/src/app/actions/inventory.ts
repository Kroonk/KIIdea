"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getInventory() {
  try {
    return await prisma.inventory.findMany({
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
  const existing = await prisma.inventory.findFirst({
    where: { itemId }
  })

  if (existing) {
    await prisma.inventory.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity }
    })
  } else {
    await prisma.inventory.create({
      data: { itemId, quantity }
    })
  }
  revalidatePath('/inventory')
}

export async function removeFromInventory(id: string, quantityToRemove?: number) {
  if (quantityToRemove) {
    const inv = await prisma.inventory.findUnique({ where: { id } })
    if (inv && inv.quantity > quantityToRemove) {
      await prisma.inventory.update({
        where: { id },
        data: { quantity: inv.quantity - quantityToRemove }
      })
      revalidatePath('/inventory')
      return;
    }
  }
  
  await prisma.inventory.delete({ where: { id } })
  revalidatePath('/inventory')
}

export async function handleBarcodeScan(barcode: string) {
  // 1. Check local DB
  let item = await prisma.item.findUnique({
    where: { barcode }
  })

  // 2. Not found locally, fetch from OpenFoodFacts
  if (!item) {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
      const data = await res.json()

      if (data.status === 1 && data.product) {
        const title = data.product.product_name_de || data.product.product_name || `Unbekanntes Produkt (${barcode})`
        const category = data.product.categories_hierarchy ? data.product.categories_hierarchy[0]?.split(':').pop() : 'Allgemein'
        
        // Save to local DB
        item = await prisma.item.create({
          data: {
            name: title,
            barcode,
            unit: 'Stück', // Or derive from quantity
            category: category
          }
        })
      }
    } catch (e) {
      console.error("OpenFoodFacts Error:", e)
    }
  }

  // 3. Add to inventory if found/created
  if (item) {
    await addToInventory(item.id, 1)
    return { success: true, itemName: item.name }
  }

  return { success: false, message: 'Produkt nicht gefunden. Bitte manuell hinzufügen.' }
}
