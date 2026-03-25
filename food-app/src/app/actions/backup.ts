"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from './auth'

export interface BackupData {
  version: string
  exportDate: string
  items: {
    id: string
    name: string
    barcode: string | null
    unit: string
    category: string | null
  }[]
  inventory: {
    id: string
    quantity: number
    expiresAt: string | null
    itemId: string
    userId: string | null
  }[]
  recipes: {
    id: string
    title: string
    description: string | null
    imageUrl: string | null
    sourceUrl: string | null
    instructions: string | null
    userId: string | null
    ingredients: {
      id: string
      quantity: number
      unit: string | null
      itemId: string
    }[]
  }[]
}

/**
 * Exportiert alle Daten als JSON (Admin only)
 */
export async function exportData(): Promise<BackupData> {
  await requireAdmin()
  try {
    const items = await prisma.item.findMany({
      orderBy: { name: 'asc' }
    })

    const inventory = await prisma.inventory.findMany({
      orderBy: { item: { name: 'asc' } }
    })

    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: true
      },
      orderBy: { title: 'asc' }
    })

    return {
      version: '2.0',
      exportDate: new Date().toISOString(),
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        barcode: item.barcode,
        unit: item.unit,
        category: item.category
      })),
      inventory: inventory.map(inv => ({
        id: inv.id,
        quantity: inv.quantity,
        expiresAt: inv.expiresAt?.toISOString() || null,
        itemId: inv.itemId,
        userId: inv.userId
      })),
      recipes: recipes.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        imageUrl: recipe.imageUrl,
        sourceUrl: recipe.sourceUrl,
        instructions: recipe.instructions,
        userId: recipe.userId,
        ingredients: recipe.ingredients.map(ing => ({
          id: ing.id,
          quantity: ing.quantity,
          unit: ing.unit,
          itemId: ing.itemId
        }))
      }))
    }
  } catch (error) {
    console.error('Export error:', error)
    throw new Error('Fehler beim Exportieren der Daten')
  }
}

/**
 * Importiert Daten aus JSON (Admin only)
 */
export async function importData(data: BackupData, mode: 'merge' | 'replace' = 'merge') {
  await requireAdmin()
  try {
    if (!data.version || !data.items || !Array.isArray(data.items)) {
      throw new Error('Ungültiges Backup-Format')
    }

    if (mode === 'replace') {
      await prisma.recipeIngredient.deleteMany()
      await prisma.recipe.deleteMany()
      await prisma.inventory.deleteMany()
      await prisma.item.deleteMany()
    }

    for (const item of data.items) {
      await prisma.item.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          name: item.name,
          barcode: item.barcode,
          unit: item.unit,
          category: item.category
        },
        update: {
          name: item.name,
          barcode: item.barcode,
          unit: item.unit,
          category: item.category
        }
      })
    }

    if (data.inventory && Array.isArray(data.inventory)) {
      for (const inv of data.inventory) {
        await prisma.inventory.upsert({
          where: { id: inv.id },
          create: {
            id: inv.id,
            quantity: inv.quantity,
            expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : null,
            itemId: inv.itemId,
            userId: inv.userId
          },
          update: {
            quantity: inv.quantity,
            expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : null
          }
        })
      }
    }

    if (data.recipes && Array.isArray(data.recipes)) {
      for (const recipe of data.recipes) {
        await prisma.recipe.upsert({
          where: { id: recipe.id },
          create: {
            id: recipe.id,
            title: recipe.title,
            description: recipe.description,
            imageUrl: recipe.imageUrl,
            sourceUrl: recipe.sourceUrl,
            instructions: recipe.instructions,
            userId: recipe.userId
          },
          update: {
            title: recipe.title,
            description: recipe.description,
            imageUrl: recipe.imageUrl,
            sourceUrl: recipe.sourceUrl,
            instructions: recipe.instructions
          }
        })

        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
          for (const ing of recipe.ingredients) {
            await prisma.recipeIngredient.upsert({
              where: { id: ing.id },
              create: {
                id: ing.id,
                quantity: ing.quantity,
                unit: ing.unit,
                recipeId: recipe.id,
                itemId: ing.itemId
              },
              update: {
                quantity: ing.quantity,
                unit: ing.unit
              }
            })
          }
        }
      }
    }

    revalidatePath('/')
    revalidatePath('/inventory')
    revalidatePath('/recipes')

    return {
      success: true,
      stats: {
        items: data.items.length,
        inventory: data.inventory?.length || 0,
        recipes: data.recipes?.length || 0
      }
    }
  } catch (error) {
    console.error('Import error:', error)
    throw new Error('Fehler beim Importieren der Daten: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'))
  }
}
