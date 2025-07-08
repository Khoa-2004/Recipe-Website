"use client"

import { useState, useEffect } from "react"
import { useRecipes } from "../contexts/RecipeContext"
import { useAuth } from "../contexts/AuthContext"
import { X, Star, Clock, Users, Edit, Trash2, Share2, Copy } from "lucide-react"
import RecipeForm from "./RecipeForm"
import { v4 as uuidv4 } from 'uuid';

export default function RecipeModal({ recipe: initialRecipe, onClose }) {
  const { addComment, rateRecipe, deleteRecipe, recipes, deleteComment } = useRecipes()
  const { user } = useAuth()
  const [showEditForm, setShowEditForm] = useState(false)
  const [comment, setComment] = useState("")
  const [userRating, setUserRating] = useState(0)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [recipe, setRecipe] = useState(initialRecipe)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [notification, setNotification] = useState({ message: "", type: "" })

  // Sync modal recipe with global state after rating changes
  useEffect(() => {
    const updated = recipes.find(r => r.id === recipe.id)
    if (updated) setRecipe(updated)
  }, [recipes, recipe.id])

  useEffect(() => {
    // Set user's own rating if available
    if (recipe.ratings && user) {
      const found = recipe.ratings.find(r => r.userId === (user.id || user.username));
      setUserRating(found ? found.rating : 0);
    }
  }, [recipe.ratings, user]);

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    if (comment.trim()) {
      const newComment = {
        id: uuidv4(),
        username: user.username,
        text: comment.trim(),
        timestamp: new Date().toISOString(),
      }

      addComment(recipe.id, newComment)
      // Update the recipe object immediately for real-time display
      recipe.comments = [...recipe.comments, newComment]
      setComment("")
    }
  }

  const handleRatingClick = (rating) => {
    setUserRating(rating)
    rateRecipe(recipe.id, rating)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    deleteRecipe(recipe.id)
    setShowDeleteConfirm(false)
    setNotification({ message: "Recipe deleted successfully!", type: "success" })
    setTimeout(() => {
      setNotification({ message: "", type: "" })
      onClose()
    }, 2000)
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  const handleShareClick = () => {
    setShowShareMenu(!showShareMenu)
  }

  const copyRecipeLink = () => {
    const recipeUrl = `${window.location.origin}?recipe=${recipe.id}`

    navigator.clipboard
      .writeText(recipeUrl)
      .then(() => {
        alert("Recipe link copied to clipboard!")
        setShowShareMenu(false)
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
        setShowShareMenu(false)
      })
  }

  const shareViaWebAPI = () => {
    const recipeUrl = `${window.location.origin}?recipe=${recipe.id}`

    if (navigator.share) {
      navigator
        .share({
          title: recipe.title,
          text: `Check out this recipe: ${recipe.description}`,
          url: recipeUrl,
        })
        .then(() => {
          setShowShareMenu(false)
        })
        .catch((err) => {
          console.log("Error sharing:", err)
          // Fallback to copy link
          copyRecipeLink()
        })
    } else {
      copyRecipeLink()
    }
  }

  // Helper to calculate average rating
  const getAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    return sum / ratings.length;
  }

  const renderStars = (rating, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={20}
        className={`${i < rating ? "star-filled" : "star-empty"} ${interactive ? "star-interactive" : ""}`}
        onClick={interactive ? () => handleRatingClick(i + 1) : undefined}
      />
    ))
  }

  if (showEditForm) {
    return <RecipeForm recipe={recipe} onClose={() => setShowEditForm(false)} />
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Notification Toast */}
        {notification.message && (
          <div className={`notification-toast ${notification.type}`}>
            {notification.message}
          </div>
        )}
        {/* Custom Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="delete-confirm-modal">
            <div className="delete-confirm-content">
              <h3>Are you sure you want to delete this recipe?</h3>
              <div className="delete-confirm-actions">
                <button className="delete-btn" onClick={confirmDelete}>Yes</button>
                <button className="cancel-btn" onClick={cancelDelete}>No</button>
              </div>
            </div>
          </div>
        )}
        <div className="modal-header">
          <h2>{recipe.title}</h2>
          <div className="modal-actions">
            <div className="share-dropdown">
              <button className="share-btn-modal" onClick={handleShareClick} title="Share recipe">
                <Share2 size={20} />
              </button>
              {showShareMenu && (
                <div className="share-menu">
                  <button onClick={shareViaWebAPI} className="share-option">
                    <Share2 size={16} />
                    Share
                  </button>
                  <button onClick={copyRecipeLink} className="share-option">
                    <Copy size={16} />
                    Copy Link
                  </button>
                </div>
              )}
            </div>
            {recipe.createdBy === user?.username && (
              <>
                <button className="edit-btn" onClick={() => setShowEditForm(true)}>
                  <Edit size={20} />
                </button>
                <button className="delete-btn" onClick={handleDelete}>
                  <Trash2 size={20} />
                </button>
              </>
            )}
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="recipe-details">
            <p className="recipe-description">{recipe.description}</p>

            <div className="recipe-meta-large">
              <div className="meta-item">
                <Clock size={20} />
                <span>{recipe.cookingTime} minutes</span>
              </div>
              <div className="meta-item">
                <Users size={20} />
                <span>{recipe.servings} servings</span>
              </div>
              <div className="meta-item">
                <span className="category-badge">{recipe.category}</span>
              </div>
            </div>

            <div className="rating-section">
              <h4>Rate this recipe:</h4>
              <div className="rating-stars-container">
                <div className="rating-stars">{renderStars(userRating, true)}</div>
                <span className="rating-text">Click to rate</span>
              </div>
              <div className="current-rating">
                <span>Average rating: </span>
                <div className="rating-display">
                  {renderStars(getAverageRating(recipe.ratings))}
                  <span className="rating-number">({getAverageRating(recipe.ratings).toFixed(2)})</span>
                  <span className="rating-count">&nbsp;•&nbsp;{recipe.ratings ? recipe.ratings.length : 0} rating{recipe.ratings && recipe.ratings.length === 1 ? '' : 's'}</span>
                </div>
              </div>
            </div>

            <div className="ingredients-section">
              <h3>Ingredients</h3>
              <ul className="ingredients-list">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </div>

            <div className="instructions-section">
              <h3>Instructions</h3>
              <div className="instructions">
                {recipe.instructions.split("\n").map((step, index) => (
                  <p key={index} className="instruction-step">
                    {step}
                  </p>
                ))}
              </div>
            </div>

            <div className="nutrition-section">
              <h3>Nutritional Information (per serving)</h3>
              <div className="nutrition-grid">
                <div className="nutrition-item">
                  <span className="nutrition-label">Calories</span>
                  <span className="nutrition-value">{recipe.nutritionalInfo.calories}</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Protein</span>
                  <span className="nutrition-value">{recipe.nutritionalInfo.protein}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Fat</span>
                  <span className="nutrition-value">{recipe.nutritionalInfo.fat}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Carbs</span>
                  <span className="nutrition-value">{recipe.nutritionalInfo.carbs}g</span>
                </div>
              </div>
            </div>

            <div className="comments-section">
              <h3>Comments ({recipe.comments.length})</h3>

              <form onSubmit={handleCommentSubmit} className="comment-form pretty-comment-form">
                <div className="comment-form-avatar">
                  <span className="avatar-circle">{user?.username?.[0]?.toUpperCase() || '?'}</span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this recipe..."
                  maxLength={500}
                  rows={3}
                  className="pretty-textarea"
                />
                <button type="submit" className="pretty-comment-btn" disabled={!comment.trim()}>
                  <span>💬</span> Add Comment
                </button>
              </form>

              <div className="comments-list">
                {recipe.comments.map((comment) => (
                  <div key={comment.id} className="comment">
                    <div className="comment-header">
                      <strong>{comment.username}</strong>
                      <span className="comment-date">{new Date(comment.timestamp).toLocaleDateString()}</span>
                      {user?.username === comment.username && (
                        <button
                          className="comment-delete-btn"
                          title="Delete comment"
                          onClick={() => deleteComment(recipe.id, comment.id)}
                          style={{ marginLeft: 8, background: 'none', border: 'none', color: '#d11a2a', cursor: 'pointer', fontSize: '1.1em' }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
