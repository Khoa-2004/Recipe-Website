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

  const addRecipe = async (newRecipe) => {
    const recipe = {
      ...newRecipe,
      rating: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      createdBy: JSON.parse(localStorage.getItem("currentUser"))?.username || "anonymous",
    };
    try {
      const response = await axios.post(`${API_URL}/recipes`, recipe);
      setRecipes(prev => [...prev, response.data]);
    } catch (error) {
      console.error("Failed to add recipe", error);
    }
  }

  const updateRecipe = async (id, updatedRecipe) => {
    try {
      const response = await axios.patch(`${API_URL}/recipes/${id}`, updatedRecipe);
      setRecipes(prev => prev.map(recipe => recipe.id === id ? response.data : recipe));
    } catch (error) {
      console.error("Failed to update recipe", error);
    }
  }

  const deleteRecipe = async (id) => {
    try {
      await axios.delete(`${API_URL}/recipes/${id}`);
      setRecipes(prev => prev.filter(recipe => recipe.id !== id));
    } catch (error) {
      console.error("Failed to delete recipe", error);
    }
  }

  const toggleFavorite = (recipeId) => {
    const updatedFavorites = favorites.includes(recipeId)
      ? favorites.filter((id) => id !== recipeId)
      : [...favorites, recipeId]

    setFavorites(updatedFavorites)
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites))
  }

  const addComment = async (recipeId, comment) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    const updatedComments = [
      ...recipe.comments,
      {
        id: Date.now(),
        ...comment,
        timestamp: new Date().toISOString(),
      },
    ];
    try {
      const response = await axios.patch(`${API_URL}/recipes/${recipeId}`, { comments: updatedComments });
      setRecipes(prev => prev.map(r => r.id === recipeId ? response.data : r));
    } catch (error) {
      console.error("Failed to add comment", error);
    }
  }

  const rateRecipe = async (recipeId, rating) => {
    try {
      const response = await axios.patch(`${API_URL}/recipes/${recipeId}`, { rating });
      setRecipes(prev => prev.map(r => r.id === recipeId ? response.data : r));
    } catch (error) {
      console.error("Failed to rate recipe", error);
    }
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
