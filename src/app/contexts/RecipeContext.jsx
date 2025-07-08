"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "./AuthContext"

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
  const { user, updateProfile } = useAuth();

  useEffect(() => {
    setLoading(true);
    let isMounted = true;
    const fetchRecipes = () => {
      axios.get(`${API_URL}/recipes`)
        .then(response => {
          if (isMounted) {
            setRecipes(response.data);
            setLoading(false);
          }
        })
        .catch(error => {
          setLoading(false);
          // Optionally fallback to localStorage or show error
          console.error("Failed to fetch recipes", error);
        });
    };
    fetchRecipes();
    const interval = setInterval(fetchRecipes, 5000); // Poll every 5 seconds
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (user && user.favorites) {
      setFavorites(user.favorites)
    } else {
      setFavorites([])
    }
  }, [user])

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
      createdAt: new Date().toISOString(),
      rating: 0,
      comments: [],
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

  const toggleFavorite = async (recipeId) => {
    if (!user) {
      alert("You must be logged in to favorite recipes.");
      return;
    }
    let updatedFavorites;
    if (favorites.includes(recipeId)) {
      updatedFavorites = favorites.filter((id) => id !== recipeId)
    } else {
      updatedFavorites = [...favorites, recipeId]
    }
    setFavorites(updatedFavorites)
    try {
      // PATCH the user's favorites in the API
      const response = await axios.patch(`${API_URL}/users/${user.id}`, { favorites: updatedFavorites })
      // Update the user in AuthContext with the new favorites
      if (response.data) {
        await updateProfile({ favorites: updatedFavorites })
      }
    } catch (error) {
      console.error("Failed to update favorites in API", error)
    }
  }

  const addComment = async (recipeId, comment) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;
    const updatedComments = [
      ...recipe.comments,
      comment, // already has id, username, text, timestamp
    ];
    try {
      const response = await axios.patch(`${API_URL}/recipes/${recipeId}`, { comments: updatedComments });
      setRecipes((prev) => prev.map((r) => (r.id === recipeId ? response.data : r)));
    } catch (error) {
      console.error("Failed to add comment to recipe", error);
    }
  };

  // Helper to calculate average rating
  function getAverageRating(ratings) {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    return sum / ratings.length;
  }

  const rateRecipe = async (recipeId, rating) => {
    if (!user) {
      alert("You must be logged in to rate recipes.");
      return;
    }
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    let updatedRatings = Array.isArray(recipe.ratings) ? [...recipe.ratings] : [];
    const userId = user.id || user.username;
    const existing = updatedRatings.find(r => r.userId === userId);
    if (existing) {
      existing.rating = rating;
    } else {
      updatedRatings.push({ userId, rating });
    }
    // Optimistically update UI
    const newRecipe = { ...recipe, ratings: updatedRatings, rating: getAverageRating(updatedRatings) };
    setRecipes(prev => prev.map(r => r.id === recipeId ? newRecipe : r));
    // PATCH the updated ratings array
    try {
      const response = await axios.patch(`${API_URL}/recipes/${recipeId}`, { ratings: updatedRatings });
      setRecipes(prev => prev.map(r => r.id === recipeId ? { ...response.data, rating: getAverageRating(response.data.ratings) } : r));
    } catch (error) {
      // Revert optimistic update if error
      setRecipes(prev => prev.map(r => r.id === recipeId ? recipe : r));
      console.error("Failed to rate recipe", error);
      alert("Failed to save your rating. Please try again.");
    }
  }

  const setSearchTermWithTracking = (term) => {
    setSearchTerm(term)
    if (term.trim()) {
      trackSearch(term.trim())
    }
  }

  const getFilteredRecipes = () => {
    let filtered = recipes.map(recipe => ({
      ...recipe,
      rating: getAverageRating(recipe.ratings)
    }));

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

    console.log(filtered.map(r => ({ id: r.id, createdAt: r.createdAt })));

    return filtered
  }

  const deleteComment = async (recipeId, commentId) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    const updatedComments = recipe.comments.filter(c => c.id !== commentId);
    try {
      const response = await axios.patch(`${API_URL}/recipes/${recipeId}`, { comments: updatedComments });
      setRecipes(prev => prev.map(r => r.id === recipeId ? response.data : r));
    } catch (error) {
      console.error("Failed to delete comment", error);
    }
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
        deleteComment,
      }}
    >
      {children}
    </RecipeContext.Provider>
  )
}
