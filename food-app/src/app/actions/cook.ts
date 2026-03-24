"use server"

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function deductIngredients(items: { itemId: string, quantity: number }[]) {
  for (const requested of items) {
    const inv = await prisma.inventory.findFirst({
      where: { itemId: requested.itemId }
    })
    
    if (inv) {
      if (inv.quantity > requested.quantity) {
        // Subtract
        await prisma.inventory.update({
          where: { id: inv.id },
          data: { quantity: inv.quantity - requested.quantity }
        })
      } else {
        // Remove entirely if we used all of it
        await prisma.inventory.delete({
          where: { id: inv.id }
        })
      }
    }
  }
  
  revalidatePath('/')
  revalidatePath('/inventory')
}
