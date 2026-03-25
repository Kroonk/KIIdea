"use server"

import { prisma } from '@/lib/prisma'
import { requireAuth } from './auth'

export type MatchedRecipeInfo = {
  recipe: {
    id: string
    title: string
    description: string | null
    imageUrl: string | null
    ingredients: Array<{
      id: string
      quantity: number
      unit: string | null
      item: { id: string; name: string; unit: string }
    }>
  }
  matchPercentage: number
  missingIngredients: Array<{ id: string; quantity: number; unit: string | null; itemId: string; inventoryHas: number; item: { id: string; name: string; unit: string } }>
  availableIngredients: Array<{ id: string; quantity: number; unit: string | null; itemId: string; item: { id: string; name: string; unit: string } }>
}

export async function getMatchedRecipes(): Promise<MatchedRecipeInfo[]> {
  const user = await requireAuth()
  try {
    const recipes = await prisma.recipe.findMany({
      where: { userId: user.id },
      include: {
        ingredients: { include: { item: true } }
      }
    })

    const inventory = await prisma.inventory.findMany({
      where: { userId: user.id },
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
        results.push({ recipe, matchPercentage: 0, missingIngredients: [], availableIngredients: [] })
        continue
      }

      let matchCount = 0
      const missing: MatchedRecipeInfo['missingIngredients'] = []
      const available: MatchedRecipeInfo['availableIngredients'] = []

      for (const req of recipe.ingredients) {
        const invQuantity = inventoryMap.get(req.itemId) || 0

        if (invQuantity >= req.quantity) {
          matchCount++
          available.push(req)
        } else {
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

export async function getRecipeMatchInfo(recipeId: string): Promise<{ availableIngredients: MatchedRecipeInfo['availableIngredients'], missingIngredients: MatchedRecipeInfo['missingIngredients'] }> {
  const user = await requireAuth()
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, userId: user.id },
    include: { ingredients: { include: { item: true } } }
  })
  if (!recipe || recipe.ingredients.length === 0) {
    return { availableIngredients: [], missingIngredients: [] }
  }

  const inventory = await prisma.inventory.findMany({
    where: { userId: user.id },
    include: { item: true }
  })
  const inventoryMap = new Map<string, number>()
  for (const inv of inventory) {
    inventoryMap.set(inv.itemId, inv.quantity)
  }

  const available: MatchedRecipeInfo['availableIngredients'] = []
  const missing: MatchedRecipeInfo['missingIngredients'] = []
  for (const req of recipe.ingredients) {
    const invQuantity = inventoryMap.get(req.itemId) || 0
    if (invQuantity >= req.quantity) {
      available.push(req)
    } else {
      missing.push({ ...req, inventoryHas: invQuantity })
    }
  }

  return { availableIngredients: available, missingIngredients: missing }
}
