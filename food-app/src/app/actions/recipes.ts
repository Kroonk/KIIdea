"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from './auth'

export async function getRecipes() {
  const user = await requireAuth()
  const recipes = await prisma.recipe.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      ingredients: {
        include: { item: true }
      }
    }
  })
  return recipes
}

export async function getRecipeById(id: string) {
  const user = await requireAuth()
  return await prisma.recipe.findFirst({
    where: { id, userId: user.id },
    include: {
      ingredients: {
        include: { item: true }
      }
    }
  })
}

export async function deleteRecipe(id: string) {
  const user = await requireAuth()
  // Verify ownership
  const recipe = await prisma.recipe.findFirst({ where: { id, userId: user.id } })
  if (!recipe) return
  await prisma.recipe.delete({ where: { id } })
  revalidatePath('/recipes')
}
