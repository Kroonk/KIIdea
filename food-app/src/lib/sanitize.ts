/**
 * Server-side sanitization for scraped content.
 * Strips HTML tags and limits string length to prevent stored XSS
 * and oversized data from external sources.
 */

const HTML_TAG_REGEX = /<[^>]*>/g

export function sanitizeText(input: string, maxLength = 500): string {
  return input
    .replace(HTML_TAG_REGEX, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim()
    .slice(0, maxLength)
}

export function sanitizeTitle(input: string): string {
  return sanitizeText(input, 200)
}

export function sanitizeInstructions(input: string): string {
  return sanitizeText(input, 10000)
}

export function sanitizeUrl(input: string): string | null {
  try {
    const url = new URL(input)
    if (['http:', 'https:'].includes(url.protocol)) {
      return url.toString()
    }
  } catch {
    // invalid URL
  }
  return null
}
