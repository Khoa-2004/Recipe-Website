"use client"

import { useRecipes } from "../contexts/RecipeContext"
import { Heart, Star, Clock, Users, Share2 } from "lucide-react"

export default function RecipeCard({ recipe, onClick }) {
  const { favorites, toggleFavorite } = useRecipes()
  const isFavorite = favorites.includes(recipe.id)

  const handleFavoriteClick = (e) => {
    e.stopPropagation()
    toggleFavorite(recipe.id)
  }

  const handleShareClick = (e) => {
    e.stopPropagation()
    const recipeUrl = `${window.location.origin}?recipe=${recipe.id}`

    if (navigator.share) {
      navigator
        .share({
          title: recipe.title,
          text: recipe.description,
          url: recipeUrl,
        })
        .catch((err) => {
          // Fallback to clipboard if share fails
          navigator.clipboard.writeText(recipeUrl)
          alert("Recipe link copied to clipboard!")
        })
    } else {
      navigator.clipboard
        .writeText(recipeUrl)
        .then(() => {
          alert("Recipe link copied to clipboard!")
        })
        .catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement("textarea")
          textArea.value = recipeUrl
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand("copy")
          document.body.removeChild(textArea)
          alert("Recipe link copied to clipboard!")
        })
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={16} className={i < Math.floor(rating) ? "star-filled" : "star-empty"} />
    ))
  }

  return (
    <div className="recipe-card" onClick={onClick}>
      <div className="recipe-image">
        <img src={`/placeholder.svg?height=200&width=300`} alt={recipe.title} />
        <div className="recipe-actions">
          <button className={`favorite-btn ${isFavorite ? "favorited" : ""}`} onClick={handleFavoriteClick}>
            <Heart size={20} />
          </button>
          <button className="share-btn" onClick={handleShareClick} title="Share recipe">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="recipe-content">
        <div className="recipe-category">{recipe.category}</div>
        <h3 className="recipe-title">{recipe.title}</h3>
        <p className="recipe-description">{recipe.description}</p>

        <div className="recipe-meta">
          <div className="meta-item">
            <Clock size={16} />
            <span>{recipe.cookingTime} min</span>
          </div>
          <div className="meta-item">
            <Users size={16} />
            <span>{recipe.servings} servings</span>
          </div>
          <div className="meta-item rating">
            {renderStars(recipe.rating)}
            <span>({recipe.rating})</span>
          </div>
        </div>
      </div>
    </div>
  )
}
