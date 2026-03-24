import { getRecipeById } from "@/app/actions/recipes"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChefHat, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  const recipe = await getRecipeById(params.id)

  if (!recipe) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto pb-24">
      <Link href="/recipes" className="flexItems-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2 inline" />
        Zurück zur Übersicht
      </Link>

      <div className="rounded-2xl overflow-hidden shadow-sm bg-card border">
        {recipe.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={recipe.imageUrl} 
            alt={recipe.title} 
            className="w-full h-64 md:h-96 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-muted/50 flex flex-col items-center justify-center text-muted-foreground">
            <ChefHat className="w-16 h-16 mb-2 opacity-30" />
            <span className="text-sm font-medium">Kein Bild verfügbar</span>
          </div>
        )}
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-primary mb-2">
            {recipe.title}
          </h1>
          {recipe.description && (
            <p className="text-lg text-muted-foreground mb-6">
              {recipe.description}
            </p>
          )}

          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div className="md:col-span-1">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 border-b pb-2">
                Zutaten
              </h3>
              <ul className="space-y-3">
                {recipe.ingredients.map((ing) => (
                  <li key={ing.id} className="flex justify-between items-start text-sm">
                    <span className="font-medium text-foreground mr-2">{ing.quantity} {ing.unit || ing.item.unit}</span>
                    <span className="text-muted-foreground text-right">{ing.item.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 border-b pb-2">
                Zubereitung
              </h3>
              <div className="prose prose-sm md:prose-base prose-stone max-w-none whitespace-pre-wrap text-muted-foreground">
                {recipe.instructions || "Keine Zubereitungsschritte hinterlegt."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Cooking */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 flex justify-center z-40 pointer-events-none px-4">
        <Button size="lg" className="rounded-full shadow-lg h-14 px-8 text-lg font-bold pointer-events-auto hover:scale-105 transition-transform">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Jetzt Kochen
        </Button>
      </div>
    </div>
  )
}
