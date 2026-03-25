"use server"

import * as cheerio from 'cheerio'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from './auth'
import { sanitizeTitle, sanitizeText, sanitizeInstructions, sanitizeUrl } from '@/lib/sanitize'
import { checkRateLimit } from '@/lib/ratelimit'

function extractInstructionText(item: unknown): string {
  if (typeof item === 'string') return item.trim()
  if (!item || typeof item !== 'object') return ''
  const obj = item as Record<string, unknown>

  // HowToSection: contains itemListElement with nested HowToSteps
  if (obj['@type'] === 'HowToSection' && Array.isArray(obj['itemListElement'])) {
    const sectionName = typeof obj['name'] === 'string' ? `**${obj['name']}**\n` : ''
    const steps = obj['itemListElement'].map((step: unknown) => extractInstructionText(step)).filter(Boolean)
    return sectionName + steps.join('\n\n')
  }

  // HowToStep
  if (obj['text'] && typeof obj['text'] === 'string') return obj['text'].trim()
  if (obj['name'] && typeof obj['name'] === 'string') return obj['name'].trim()
  if (obj['description'] && typeof obj['description'] === 'string') return obj['description'].trim()

  return ''
}

function parseInstructions(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim()
  if (Array.isArray(raw)) {
    return raw.map((item) => extractInstructionText(item)).filter(Boolean).join('\n\n')
  }
  return ''
}

export async function scrapeRecipeUrl(url: string) {
  const user = await requireAuth()

  // Rate Limit: max 5 Scrapes pro Stunde pro User
  const { success: rateLimitOk } = checkRateLimit(`scrape:${user.id}`, 5, 60 * 60 * 1000)
  if (!rateLimitOk) {
    return { success: false, message: "Zu viele Anfragen. Bitte warte eine Stunde." }
  }

  try {
    // URL validation: only allow http/https, block local addresses
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return { success: false, message: "Ungültige URL." }
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { success: false, message: "Nur HTTP/HTTPS URLs erlaubt." }
    }
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsedUrl.hostname) || parsedUrl.hostname.startsWith('192.168.') || parsedUrl.hostname.startsWith('10.')) {
      return { success: false, message: "Lokale URLs sind nicht erlaubt." }
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Foodlabs/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error("Konnte die URL nicht abrufen.")

    const html = await res.text()
    const $ = cheerio.load(html)

    let recipeData: Record<string, unknown> | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $('script[type="application/ld+json"]').each((_: number, el: any) => {
      try {
        const json = JSON.parse($(el).html() || '{}')
        const findRecipe = (obj: unknown): Record<string, unknown> | null => {
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const r = findRecipe(item)
              if (r) return r
            }
          } else if (obj && typeof obj === 'object') {
            const o = obj as Record<string, unknown>
            if (o['@type'] === 'Recipe' || (Array.isArray(o['@type']) && (o['@type'] as string[]).includes('Recipe'))) {
              return o
            }
            if (o['@graph']) {
              return findRecipe(o['@graph'])
            }
          }
          return null
        }

        const found = findRecipe(json)
        if (found) {
          recipeData = found
        }
      } catch {
        // ignore JSON parse errors
      }
    })

    if (!recipeData) {
      return { success: false, message: "Keine gültigen Rezeptdaten (Schema.org) auf der Seite gefunden." }
    }

    const rd = recipeData as Record<string, unknown>
    const title = sanitizeTitle((rd.name as string) || "Unbekanntes Rezept")
    const description = sanitizeText((rd.description as string) || "")
    let imageUrl: string | null = null
    const img = rd.image
    if (img) {
      let rawUrl: string | null = null
      if (typeof img === 'string') rawUrl = img
      else if (Array.isArray(img)) rawUrl = typeof img[0] === 'string' ? img[0] : (img[0] as Record<string, unknown>)?.url as string || null
      else if (typeof img === 'object' && img !== null) rawUrl = (img as Record<string, unknown>).url as string || null
      imageUrl = rawUrl ? sanitizeUrl(rawUrl) : null
    }

    const instructions = sanitizeInstructions(parseInstructions(rd.recipeInstructions))

    const ingredientsRaw = (rd.recipeIngredient || []) as string[]

    const recipe = await prisma.recipe.create({
      data: {
        title,
        description,
        imageUrl,
        sourceUrl: url,
        instructions,
        userId: user.id
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

       // Sanitize & cut long names
       n = sanitizeText(n, 50)

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
       } catch {
         // Silently ignore if unique constraint fails (e.g. duplicate ingredient in recipe)
       }
    }

    revalidatePath('/recipes')
    return { success: true, recipeId: recipe.id }

  } catch (e) {
    console.error("Scraping Error:", e)
    return { success: false, message: e instanceof Error ? e.message : "Unbekannter Fehler beim Scraping." }
  }
}
