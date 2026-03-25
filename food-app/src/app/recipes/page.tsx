import { getRecipes } from "@/app/actions/recipes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Plus, ChefHat } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function RecipesPage() {
  const recipes = await getRecipes()

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary flex items-center gap-2">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
            Meine Rezepte
          </h1>
          <p className="text-muted-foreground mt-1">
            Deine gesammelten Lieblingsgerichte und Kochideen.
          </p>
        </div>
        <Link href="/recipes/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Neues Rezept
          </Button>
        </Link>
      </div>

      {recipes.length === 0 ? (
        <Card className="border-dashed bg-muted/20 mt-4">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ChefHat className="w-16 h-16 text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-xl font-semibold mb-2">Noch keine Rezepte</h3>
            <p className="text-muted-foreground max-w-md">
              Füge dein erstes Rezept manuell hinzu oder importiere es von einer Website.
            </p>
            <Link href="/recipes/new" className="mt-6">
              <Button>Erstes Rezept erstellen</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
              <Card className="overflow-hidden h-full hover:border-primary/50 hover:shadow-md transition-all group">
                {recipe.imageUrl ? (
                  <div className="w-full h-48 bg-muted relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={recipe.imageUrl} 
                      alt={recipe.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-muted/50 flex items-center justify-center">
                    <ChefHat className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
                    {recipe.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {recipe.description || `${recipe.ingredients.length} Zutaten benötigt`}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
