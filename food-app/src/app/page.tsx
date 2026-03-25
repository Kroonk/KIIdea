import { getMatchedRecipes } from "@/app/actions/match"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ChefHat, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import CookRecipeDialog from "@/components/CookRecipeDialog"

export const dynamic = "force-dynamic"

export default async function Home() {
  const matched = await getMatchedRecipes()

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary">Foodlabs</h1>
          <p className="text-muted-foreground mt-2 text-base sm:text-lg">Was kochen wir heute?</p>
        </div>
        <Link href="/add">
          <Button variant="outline" size="sm" className="sm:size-default">Vorrat auffüllen</Button>
        </Link>
      </div>

      {matched.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ChefHat className="w-16 h-16 text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-xl font-semibold mb-2">Keine Rezepte gefunden</h3>
            <p className="text-muted-foreground max-w-md">
              Du hast noch keine Rezepte in deiner Datenbank.
            </p>
            <div className="flex gap-4 mt-6 justify-center">
              <Link href="/recipes/new">
                <Button>Rezept hinzufügen</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matched.map((m) => (
            <Card key={m.recipe.id} className="overflow-hidden flex flex-col hover:border-primary/50 transition-all shadow-sm">
              {m.recipe.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.recipe.imageUrl} alt={m.recipe.title} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-muted/50 flex items-center justify-center">
                  <ChefHat className="w-10 h-10 text-muted-foreground/30" />
                </div>
              )}
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="line-clamp-2 text-lg">
                    <Link href={`/recipes/${m.recipe.id}`} className="hover:text-primary transition-colors">
                      {m.recipe.title}
                    </Link>
                  </CardTitle>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold shrink-0 ${m.matchPercentage === 100 ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : m.matchPercentage > 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                    {m.matchPercentage}%
                  </div>
                </div>
                <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">
                  {m.recipe.description || "Ein Rezept aus deiner Sammlung."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 flex-grow">
                {m.missingIngredients.length > 0 ? (
                  <div className="text-sm">
                    <p className="font-semibold text-destructive flex items-center gap-1 mb-1">
                      <XCircle className="w-4 h-4" /> Fehlend:
                    </p>
                    <ul className="text-muted-foreground line-clamp-2">
                      {m.missingIngredients.map((ing: any) => (
                        <li key={ing.id}>• {Math.max(0, ing.quantity - (ing.inventoryHas || 0))} {ing.unit || ing.item.unit} {ing.item.name}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 font-medium bg-green-50 dark:bg-green-950/30 w-fit px-2 py-1 rounded-md">
                    <CheckCircle2 className="w-4 h-4" /> Alles im Haus!
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <CookRecipeDialog recipe={m.recipe} availableIngredients={m.availableIngredients} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
