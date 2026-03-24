"use server"

import * as cheerio from 'cheerio'
import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function scrapeRecipeUrl(url: string) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }})
    if (!res.ok) throw new Error("Konnte die URL nicht abrufen.")
    
    const html = await res.text()
    const $ = cheerio.load(html)
    
    let recipeData: any = null
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}')
        const findRecipe = (obj: any): any => {
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const r = findRecipe(item)
              if (r) return r
            }
          } else if (obj && typeof obj === 'object') {
            if (obj['@type'] === 'Recipe' || (Array.isArray(obj['@type']) && obj['@type'].includes('Recipe'))) {
              return obj
            }
            if (obj['@graph']) {
              return findRecipe(obj['@graph'])
            }
          }
          return null
        }
        
        const found = findRecipe(json)
        if (found) {
          recipeData = found
        }
      } catch (e) {
        // ignore JSON parse errors
      }
    })

    if (!recipeData) {
      return { success: false, message: "Keine gültigen Rezeptdaten (Schema.org) auf der Seite gefunden." }
    }

    const title = recipeData.name
    const description = recipeData.description
    let imageUrl = null
    if (recipeData.image) {
      if (typeof recipeData.image === 'string') imageUrl = recipeData.image
      else if (Array.isArray(recipeData.image)) imageUrl = recipeData.image[0]
      else if (recipeData.image.url) imageUrl = recipeData.image.url
    }

    const instructions = Array.isArray(recipeData.recipeInstructions) 
      ? recipeData.recipeInstructions.map((i: any) => i.text || i).join('\n\n')
      : recipeData.recipeInstructions

    const ingredientsRaw = recipeData.recipeIngredient || []

    const recipe = await prisma.recipe.create({
      data: {
        title: title || "Unbekanntes Rezept",
        description: description || "",
        imageUrl,
        sourceUrl: url,
        instructions: instructions || ""
      }
    })

    // Parse ingredients roughly
    for (const ing of ingredientsRaw) {
       let q = 1, u = "Stück", n = ing

       // "100 g Mehl" -> ["100 g Mehl", "100", "g", "Mehl"]
       const match = ing.match(/^([\d.,]+)\s*([a-zA-Z]+)?\s+(.+)$/)
       if (match) {
         q = parseFloat(match[1].replace(',', '.')) || 1
         u = match[2] || "Portion"
         n = match[3]
       } else {
         n = ing.trim()
       }

       // Cut long names
       if (n.length > 50) n = n.substring(0, 50)

       // Upsert Item if it exists or create
       let item = await prisma.item.findUnique({ where: { name: n }})
       if (!item) {
         // Some databases might throw if we hit concurrency with names, but sequential loop is fine
         item = await prisma.item.create({ data: { name: n, unit: u }})
       }

       try {
         await prisma.recipeIngredient.create({
           data: {
             recipeId: recipe.id,
             itemId: item.id,
             quantity: q,
             unit: u
           }
         })
       } catch (err: any) {
         // Silently ignore if unique constraint fails (e.g. duplicate ingredient in recipe)
       }
    }

    revalidatePath('/recipes')
    return { success: true, recipeId: recipe.id }

  } catch (e: any) {
    console.error("Scraping Error:", e)
    return { success: false, message: e.message }
  }
}
