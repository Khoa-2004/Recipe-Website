"use client"

import { useState } from "react"
import { useRecipes } from "../contexts/RecipeContext"
import RecipeCard from "./RecipeCard"
import SearchAndFilter from "./SearchAndFilter"
import RecipeModal from "./RecipeModal"
import RecipeSuggestions from "./RecipeSuggestions"

export default function RecipeList() {
  const { getFilteredRecipes, loading } = useRecipes()
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  const filteredRecipes = getFilteredRecipes()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading recipes...</p>
      </div>
    )
  }

  return (
    <div className="recipe-list-container">
      <SearchAndFilter />

      {/* Recipe Suggestions */}
      <RecipeSuggestions onRecipeClick={setSelectedRecipe} />

      <div className="main-recipes-section">
        <h2 className="section-title">All Recipes</h2>

        {filteredRecipes.length === 0 ? (
          <div className="no-recipes">
            <h3>No recipes found</h3>
            <p>Try adjusting your search or filters, or add a new recipe!</p>
          </div>
        ) : (
          <div className="recipe-grid">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelectedRecipe(recipe)} />
            ))}
          </div>
        )}
      </div>

      {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
    </div>
  )
}
