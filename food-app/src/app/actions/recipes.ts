"use server"

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getRecipes() {
  const recipes = await prisma.recipe.findMany({
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
  return await prisma.recipe.findUnique({
    where: { id },
    include: { 
      ingredients: { 
        include: { item: true } 
      } 
    }
  })
}

export async function deleteRecipe(id: string) {
  await prisma.recipe.delete({ where: { id } })
  revalidatePath('/recipes')
}
