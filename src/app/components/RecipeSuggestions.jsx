"use client"

import { useState, useEffect } from "react"
import { useRecipes } from "../contexts/RecipeContext"
import { useAuth } from "../contexts/AuthContext"
import { ChevronLeft, ChevronRight, TrendingUp, Heart, Star, Clock, Users } from "lucide-react"

export default function RecipeSuggestions({ onRecipeClick }) {
  const { recipes, favorites, filterCategory } = useRecipes()
  const { user } = useAuth()
  const [suggestedRecipes, setSuggestedRecipes] = useState([])
  const [trendingRecipes, setTrendingRecipes] = useState([])
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)
  const [currentTrendingIndex, setCurrentTrendingIndex] = useState(0)

  useEffect(() => {
    generateSuggestions()
    generateTrendingRecipes()
  }, [recipes, favorites, user, filterCategory])

  const generateSuggestions = () => {
    if (!recipes.length) return

    let filtered = recipes;
    if (filterCategory && filterCategory !== "All") {
      filtered = filtered.filter((recipe) => recipe.category === filterCategory);
    }
    // Sort by average rating, high to low
    const suggestions = filtered
      .slice()
      .sort((a, b) => getAverageRating(b.ratings) - getAverageRating(a.ratings))
      .slice(0, 5);
    setSuggestedRecipes(suggestions);
  }

  const generateTrendingRecipes = () => {
    if (!recipes.length) return

    // Trending: sort all recipes by average rating (descending), top 5
    const trending = recipes
      .slice()
      .sort((a, b) => getAverageRating(b.ratings) - getAverageRating(a.ratings))
      .slice(0, 5)

    setTrendingRecipes(trending)
  }

  const getUserPreferences = () => {
    const preferences = {
      favoriteCategories: [],
      recentSearches: [],
      favoriteRecipeCategories: [],
      dietaryPreferences: user?.dietaryPreferences || [],
    }

    // Get favorite categories from favorited recipes
    const favoriteRecipesList = recipes.filter((recipe) => favorites.includes(recipe.id))
    preferences.favoriteCategories = [...new Set(favoriteRecipesList.map((recipe) => recipe.category))]

    // Get recent searches from localStorage
    const recentSearches = JSON.parse(localStorage.getItem("recentSearches") || "[]")
    preferences.recentSearches = recentSearches.slice(0, 5) // Last 5 searches

    // Get categories from recently viewed recipes
    const recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewedRecipes") || "[]")
    const recentlyViewedRecipes = recipes.filter((recipe) => recentlyViewed.includes(recipe.id))
    preferences.favoriteRecipeCategories = [...new Set(recentlyViewedRecipes.map((recipe) => recipe.category))]

    return preferences
  }

  const calculateRecipeScore = (recipe, preferences) => {
    let score = 0

    // Base score from average rating
    score += getAverageRating(recipe.ratings) * 10

    // Boost for favorite categories
    if (preferences.favoriteCategories.includes(recipe.category)) {
      score += 30
    }

    // Boost for recently viewed categories
    if (preferences.favoriteRecipeCategories.includes(recipe.category)) {
      score += 20
    }

    // Boost for recent search matches
    preferences.recentSearches.forEach((search) => {
      if (
        recipe.title.toLowerCase().includes(search.toLowerCase()) ||
        recipe.description.toLowerCase().includes(search.toLowerCase()) ||
        recipe.ingredients.some((ing) => ing.toLowerCase().includes(search.toLowerCase()))
      ) {
        score += 25
      }
    })

    // ENHANCED: Boost for dietary preferences matching dietary tags
    if (recipe.dietaryTags && preferences.dietaryPreferences.length > 0) {
      const matchingTags = recipe.dietaryTags.filter((tag) => preferences.dietaryPreferences.includes(tag))
      score += matchingTags.length * 40 // High boost for dietary matches
    }

    // Legacy dietary preference matching (for older recipes without tags)
    preferences.dietaryPreferences.forEach((pref) => {
      const prefName = pref.replace("-", " ").toLowerCase()
      if (recipe.title.toLowerCase().includes(prefName) || recipe.description.toLowerCase().includes(prefName)) {
        score += 15
      }
    })

    // Boost for shorter cooking times (convenience factor)
    if (recipe.cookingTime <= 30) {
      score += 10
    }

    // Boost for recipes with comments (engagement)
    score += recipe.comments.length * 5

    return score
  }

  const calculateTrendingScore = (recipe) => {
    let score = 0

    // Rating weight (40%)
    score += getAverageRating(recipe.ratings) * 20

    // Comments weight (30%)
    score += recipe.comments.length * 10

    // Recency weight (20%) - newer recipes get higher scores
    const daysSinceCreated = (Date.now() - new Date(recipe.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    const recencyScore = Math.max(0, 30 - daysSinceCreated) // Max 30 points, decreasing over time
    score += recencyScore

    // Engagement rate (10%) - recipes with high rating and comments
    if (getAverageRating(recipe.ratings) > 4 && recipe.comments.length > 2) {
      score += 15
    }

    return score
  }

  const trackRecipeView = (recipe) => {
    // Track recently viewed recipes
    const recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewedRecipes") || "[]")
    const updatedViewed = [recipe.id, ...recentlyViewed.filter((id) => id !== recipe.id)].slice(0, 10)
    localStorage.setItem("recentlyViewedRecipes", JSON.stringify(updatedViewed))

    // Call the parent click handler
    onRecipeClick(recipe)
  }

  const nextSuggestion = () => {
    setCurrentSuggestionIndex((prev) => (prev + 1 >= suggestedRecipes.length - 2 ? 0 : prev + 1))
  }

  const prevSuggestion = () => {
    setCurrentSuggestionIndex((prev) => (prev - 1 < 0 ? Math.max(0, suggestedRecipes.length - 3) : prev - 1))
  }

  const nextTrending = () => {
    setCurrentTrendingIndex((prev) => (prev + 1 >= trendingRecipes.length - 2 ? 0 : prev + 1))
  }

  const prevTrending = () => {
    setCurrentTrendingIndex((prev) => (prev - 1 < 0 ? Math.max(0, trendingRecipes.length - 3) : prev - 1))
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={14} className={i < Math.floor(rating) ? "star-filled" : "star-empty"} />
    ))
  }

  const getDietaryTagIcon = (tagId) => {
    const tagMap = {
      vegetarian: "🥬",
      vegan: "🌱",
      "gluten-free": "🌾",
      "dairy-free": "🥛",
      keto: "🥑",
      "low-carb": "🥩",
      "high-protein": "💪",
      "low-sodium": "🧂",
    }
    return tagMap[tagId] || "🏷️"
  }

  // Helper to calculate average rating
  const getAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    return sum / ratings.length;
  };

  const SuggestionCard = ({ recipe, isTrending = false }) => (
    <div className={`suggestion-card ${isTrending ? "trending-card" : ""}`} onClick={() => trackRecipeView(recipe)}>
      {isTrending && (
        <div className="trending-badge">
          <TrendingUp size={12} />
          Trending
        </div>
      )}

      <div className="suggestion-image">
        <img src={recipe.imageUrl || `/placeholder.svg?height=120&width=200`} alt={recipe.title} />
        {favorites.includes(recipe.id) && (
          <div className="favorite-indicator">
            <Heart size={14} fill="currentColor" />
          </div>
        )}
      </div>

      <div className="suggestion-content">
        <div className="suggestion-category">{recipe.category}</div>
        <h4 className="suggestion-title">{recipe.title}</h4>
        <p className="suggestion-description">{recipe.description}</p>

        {/* Dietary Tags Display */}
        {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
          <div className="suggestion-dietary-tags">
            {recipe.dietaryTags.slice(0, 3).map((tag) => (
              <span key={tag} className="dietary-tag-mini" title={tag.replace("-", " ")}>
                {getDietaryTagIcon(tag)}
              </span>
            ))}
            {recipe.dietaryTags.length > 3 && (
              <span className="dietary-tag-more">+{recipe.dietaryTags.length - 3}</span>
            )}
          </div>
        )}

        <div className="suggestion-meta">
          <div className="meta-item">
            <Clock size={12} />
            <span>{recipe.cookingTime}m</span>
          </div>
          <div className="meta-item">
            <Users size={12} />
            <span>{recipe.servings}</span>
          </div>
          <div className="meta-item rating">
            {renderStars(getAverageRating(recipe.ratings))}
            <span>({getAverageRating(recipe.ratings).toFixed(2)})</span>
          </div>
        </div>

        {recipe.comments.length > 0 && (
          <div className="suggestion-engagement">
            {recipe.comments.length} comment{recipe.comments.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  )

  // Pad to always show 2 cards at a time
  const getPaddedRecipes = (recipesArr) => {
    if (recipesArr.length >= 2) return recipesArr;
    return [...recipesArr, ...Array(2 - recipesArr.length).fill(null)];
  };
  const paddedSuggestions = getPaddedRecipes(suggestedRecipes);
  const paddedTrending = getPaddedRecipes(trendingRecipes);

  // Calculate number of pages for dots
  const suggestionPages = Math.ceil(paddedSuggestions.length / 2);
  const trendingPages = Math.ceil(paddedTrending.length / 2);

  if (!recipes.length) return null

  return (
    <div className="recipe-suggestions">
      {/* Suggested for You Section */}
      {suggestedRecipes.length > 0 && (
        <div className="suggestions-section">
          <div className="suggestions-header">
            <h3>
              <Heart size={20} />
              Suggested for You
            </h3>
            <p>Based on your preferences and activity</p>
          </div>

          <div className="suggestions-carousel">
            <button className="carousel-btn prev" onClick={prevSuggestion} disabled={suggestedRecipes.length <= 2}>
              <ChevronLeft size={20} />
            </button>

            <div className="suggestions-container">
              <div
                className="suggestions-track"
                style={{
                  transform: `translateX(-${currentSuggestionIndex * (100 / 2)}%)`,
                  width: `${(paddedSuggestions.length / 2) * 100}%`,
                }}
              >
                {paddedSuggestions.map((recipe, idx) =>
                  recipe ? (
                    <SuggestionCard key={`suggested-${recipe.id}-${idx}`} recipe={recipe} />
                  ) : (
                    <div key={`suggested-empty-${idx}`} className="suggestion-card empty-card" />
                  )
                )}
              </div>
            </div>

            <button className="carousel-btn next" onClick={nextSuggestion} disabled={suggestedRecipes.length <= 2}>
              <ChevronRight size={20} />
            </button>
          </div>
          {/* Pagination dots for suggestions */}
          <div className="carousel-dots">
            {Array.from({ length: suggestionPages }).map((_, idx) => (
              <button
                key={idx}
                className={`carousel-dot${currentSuggestionIndex === idx ? " active" : ""}`}
                onClick={() => setCurrentSuggestionIndex(idx)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Trending Recipes Section */}
      {trendingRecipes.length > 0 && (
        <div className="suggestions-section">
          <div className="suggestions-header">
            <h3>
              <TrendingUp size={20} />
              Trending Now
            </h3>
            <p>Popular recipes everyone's talking about</p>
          </div>

          <div className="suggestions-carousel">
            <button className="carousel-btn prev" onClick={prevTrending} disabled={trendingRecipes.length <= 2}>
              <ChevronLeft size={20} />
            </button>

            <div className="suggestions-container">
              <div
                className="suggestions-track"
                style={{
                  transform: `translateX(-${currentTrendingIndex * (100 / 2)}%)`,
                  width: `${(paddedTrending.length / 2) * 100}%`,
                }}
              >
                {paddedTrending.map((recipe, idx) =>
                  recipe ? (
                    <SuggestionCard key={`trending-${recipe.id}-${idx}`} recipe={recipe} isTrending />
                  ) : (
                    <div key={`trending-empty-${idx}`} className="suggestion-card empty-card" />
                  )
                )}
              </div>
            </div>

            <button className="carousel-btn next" onClick={nextTrending} disabled={trendingRecipes.length <= 2}>
              <ChevronRight size={20} />
            </button>
          </div>
          {/* Pagination dots for trending */}
          <div className="carousel-dots">
            {Array.from({ length: trendingPages }).map((_, idx) => (
              <button
                key={idx}
                className={`carousel-dot${currentTrendingIndex === idx ? " active" : ""}`}
                onClick={() => setCurrentTrendingIndex(idx)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
