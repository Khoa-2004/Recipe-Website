"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const RecipeContext = createContext()
const API_URL = "http://localhost:3001"

export const useRecipes = () => {
  const context = useContext(RecipeContext)
  if (!context) {
    throw new Error("useRecipes must be used within a RecipeProvider")
  }
  return context
}

export const RecipeProvider = ({ children }) => {
  const [recipes, setRecipes] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("All")
  const [sortBy, setSortBy] = useState("newest")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}/recipes`)
      .then(response => {
        setRecipes(response.data);
        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
        // Optionally fallback to localStorage or show error
        console.error("Failed to fetch recipes", error);
      });
  }, []);

  // Track search terms for suggestions
  const trackSearch = (term) => {
    if (!term.trim()) return

    const recentSearches = JSON.parse(localStorage.getItem("recentSearches") || "[]")
    const updatedSearches = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 10)
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches))
  }

  const addRecipe = (newRecipe) => {
    const recipe = {
      ...newRecipe,
      id: Date.now(),
      rating: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      createdBy: JSON.parse(localStorage.getItem("currentUser"))?.username || "anonymous",
    }

    const updatedRecipes = [...recipes, recipe]
    setRecipes(updatedRecipes)
    localStorage.setItem("recipes", JSON.stringify(updatedRecipes))
  }

  const updateRecipe = (id, updatedRecipe) => {
    const updatedRecipes = recipes.map((recipe) => (recipe.id === id ? { ...recipe, ...updatedRecipe } : recipe))
    setRecipes(updatedRecipes)
    localStorage.setItem("recipes", JSON.stringify(updatedRecipes))
  }

  const deleteRecipe = (id) => {
    const updatedRecipes = recipes.filter((recipe) => recipe.id !== id)
    setRecipes(updatedRecipes)
    localStorage.setItem("recipes", JSON.stringify(updatedRecipes))
  }

  const toggleFavorite = (recipeId) => {
    const updatedFavorites = favorites.includes(recipeId)
      ? favorites.filter((id) => id !== recipeId)
      : [...favorites, recipeId]

    setFavorites(updatedFavorites)
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites))
  }

  const addComment = (recipeId, comment) => {
    const updatedRecipes = recipes.map((recipe) => {
      if (recipe.id === recipeId) {
        return {
          ...recipe,
          comments: [
            ...recipe.comments,
            {
              id: Date.now(),
              ...comment,
              timestamp: new Date().toISOString(),
            },
          ],
        }
      }
      return recipe
    })
    setRecipes(updatedRecipes)
    localStorage.setItem("recipes", JSON.stringify(updatedRecipes))
  }

  const rateRecipe = (recipeId, rating) => {
    const updatedRecipes = recipes.map((recipe) => {
      if (recipe.id === recipeId) {
        return { ...recipe, rating }
      }
      return recipe
    })
    setRecipes(updatedRecipes)
    localStorage.setItem("recipes", JSON.stringify(updatedRecipes))
  }

  const setSearchTermWithTracking = (term) => {
    setSearchTerm(term)
    if (term.trim()) {
      trackSearch(term.trim())
    }
  }

  const getFilteredRecipes = () => {
    let filtered = recipes

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          recipe.ingredients.some((ingredient) => ingredient.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Category filter
    if (filterCategory !== "All") {
      filtered = filtered.filter((recipe) => recipe.category === filterCategory)
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        break
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case "alphabetical":
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        break
    }

    return filtered
  }

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        favorites,
        searchTerm,
        setSearchTerm: setSearchTermWithTracking,
        filterCategory,
        setFilterCategory,
        sortBy,
        setSortBy,
        loading,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        toggleFavorite,
        addComment,
        rateRecipe,
        getFilteredRecipes,
      }}
    >
      {children}
    </RecipeContext.Provider>
  )
}
