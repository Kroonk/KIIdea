export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Wraps a server action call on the client side with consistent
 * error handling and optional toast feedback via sonner.
 *
 * Usage (in client components):
 *   import { toast } from 'sonner'
 *
 *   const result = await handleAction(
 *     () => addToInventory(itemId, quantity),
 *     { successMessage: 'Hinzugefügt!', errorMessage: 'Fehler beim Hinzufügen' }
 *   )
 */
export async function handleAction<T>(
  action: () => Promise<T>,
  options: {
    successMessage?: string
    errorMessage?: string
  } = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await action()
    return { data, error: null }
  } catch (error) {
    const message = error instanceof AppError
      ? error.message
      : options.errorMessage || 'Ein unerwarteter Fehler ist aufgetreten'

    console.error('[Action Error]', error)
    return { data: null, error: message }
  }
}
