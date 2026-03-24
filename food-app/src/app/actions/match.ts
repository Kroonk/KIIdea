"use server"

import { prisma } from '@/lib/prisma'

export type MatchedRecipeInfo = {
  recipe: any
  matchPercentage: number
  missingIngredients: any[]
  availableIngredients: any[]
}

export async function getMatchedRecipes(): Promise<MatchedRecipeInfo[]> {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: { include: { item: true } }
      }
    })

    const inventory = await prisma.inventory.findMany({
      include: { item: true }
    })

    // Create a map for fast lookup
    const inventoryMap = new Map<string, number>()
    for (const inv of inventory) {
      inventoryMap.set(inv.itemId, inv.quantity)
    }

    const results: MatchedRecipeInfo[] = []

    for (const recipe of recipes) {
      if (recipe.ingredients.length === 0) {
        // Wenn das Rezept keine Zutaten hat (vielleicht schlecht gescrapet), ist es immer 100% aber langweilig
        results.push({ recipe, matchPercentage: 0, missingIngredients: [], availableIngredients: [] })
        continue
      }

      let matchCount = 0
      let missing = []
      let available = []

      for (const req of recipe.ingredients) {
        const invQuantity = inventoryMap.get(req.itemId) || 0

        if (invQuantity >= req.quantity) {
          matchCount++
          available.push(req)
        } else {
          // Not enough quantity, or user doesn't have it
          missing.push({ ...req, inventoryHas: invQuantity })
        }
      }

      const percentage = Math.round((matchCount / recipe.ingredients.length) * 100)

      results.push({
        recipe,
        matchPercentage: percentage,
        missingIngredients: missing,
        availableIngredients: available
      })
    }

    // Sort by highest match percentage
    results.sort((a, b) => b.matchPercentage - a.matchPercentage)
    return results
  } catch (error) {
    console.error('Error matching recipes:', error)
    return []
  }
}
