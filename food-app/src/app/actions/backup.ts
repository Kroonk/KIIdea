"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
  }[]
  recipes: {
    id: string
    title: string
    description: string | null
    imageUrl: string | null
    sourceUrl: string | null
    instructions: string | null
    ingredients: {
      id: string
      quantity: number
      unit: string | null
      itemId: string
    }[]
  }[]
}

/**
 * Exportiert alle Daten als JSON
 */
export async function exportData(): Promise<BackupData> {
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
      version: '1.4',
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
        itemId: inv.itemId
      })),
      recipes: recipes.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        imageUrl: recipe.imageUrl,
        sourceUrl: recipe.sourceUrl,
        instructions: recipe.instructions,
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
 * Importiert Daten aus JSON
 * @param data BackupData
 * @param mode 'merge' = Bestehende behalten + Neue hinzufügen, 'replace' = Alles löschen + Neu importieren
 */
export async function importData(data: BackupData, mode: 'merge' | 'replace' = 'merge') {
  try {
    // Validiere Daten
    if (!data.version || !data.items || !Array.isArray(data.items)) {
      throw new Error('Ungültiges Backup-Format')
    }

    // Replace Mode: Alle Daten löschen
    if (mode === 'replace') {
      await prisma.recipeIngredient.deleteMany()
      await prisma.recipe.deleteMany()
      await prisma.inventory.deleteMany()
      await prisma.item.deleteMany()
    }

    // Items importieren (mit Upsert für Merge-Mode)
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

    // Inventory importieren
    if (data.inventory && Array.isArray(data.inventory)) {
      for (const inv of data.inventory) {
        await prisma.inventory.upsert({
          where: { id: inv.id },
          create: {
            id: inv.id,
            quantity: inv.quantity,
            expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : null,
            itemId: inv.itemId
          },
          update: {
            quantity: inv.quantity,
            expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : null
          }
        })
      }
    }

    // Recipes importieren
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
            instructions: recipe.instructions
          },
          update: {
            title: recipe.title,
            description: recipe.description,
            imageUrl: recipe.imageUrl,
            sourceUrl: recipe.sourceUrl,
            instructions: recipe.instructions
          }
        })

        // Recipe Ingredients importieren
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

    // Cache invalidieren
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
