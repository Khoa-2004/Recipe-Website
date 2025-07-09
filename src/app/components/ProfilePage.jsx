"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useRecipes } from "../contexts/RecipeContext"
import { Edit, Heart, ChefHat, X } from "lucide-react"
import RecipeForm from "./RecipeForm"

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const { recipes, favorites } = useRecipes()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    profilePicture: user?.profilePicture || "",
    dietaryPreferences: user?.dietaryPreferences || [],
  })

  const userRecipes = recipes.filter((recipe) => recipe.createdBy === user?.username)
  const favoriteRecipes = recipes.filter((recipe) => favorites.includes(recipe.id))

  const dietaryOptions = [
    { id: "vegetarian", name: "Vegetarian" },
    { id: "vegan", name: "Vegan" },
    { id: "gluten-free", name: "Gluten-Free" },
    { id: "dairy-free", name: "Dairy-Free" },
    { id: "keto", name: "Keto" },
    { id: "low-carb", name: "Low-Carb" },
    { id: "high-protein", name: "High-Protein" },
    { id: "low-sodium", name: "Low-Sodium" },
  ]

  const dietaryOptionsMap = {
    "vegetarian": "Vegetarian",
    "vegan": "Vegan",
    "gluten-free": "Gluten-Free",
    "dairy-free": "Dairy-Free",
    "keto": "Keto",
    "low-carb": "Low-Carb",
    "high-protein": "High-Protein",
    "low-sodium": "Low-Sodium",
  };

  const handleSave = (e) => {
    e.preventDefault()
    updateProfile(profileData)
    setIsEditing(false)
  }

  const handleDietaryChange = (preference) => {
    setProfileData((prev) => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(preference)
        ? prev.dietaryPreferences.filter((p) => p !== preference)
        : [...prev.dietaryPreferences, preference],
    }))
  }

  const getUserStats = () => {
    const totalComments = recipes.reduce((total, recipe) => {
      return total + recipe.comments.filter((comment) => comment.username === user?.username).length
    }, 0)

    return {
      recipesCreated: userRecipes.length,
      favoriteRecipes: favoriteRecipes.length,
      commentsPosted: totalComments,
    }
  }

  const stats = getUserStats()

  const [activeTab, setActiveTab] = useState("overview")
  const [editingRecipe, setEditingRecipe] = useState(null)

  const tabs = [
    { id: "overview", name: "Overview", icon: "👤" },
    { id: "my-recipes", name: "My Recipes", icon: "👨‍🍳" },
    { id: "favorites", name: "Favorites", icon: "❤️" },
  ]

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">
            {user?.profilePicture ? (
              <img src={user.profilePicture || "/placeholder.svg"} alt="Profile" />
            ) : (
              <div className="avatar-placeholder">{user?.username?.charAt(0).toUpperCase()}</div>
            )}
          </div>

          <div className="profile-details">
            <h2>{user?.username}</h2>
            <p>{user?.email}</p>
            <div className="profile-stats">
              <div className="stat-item">
                <ChefHat size={20} />
                <span>{stats.recipesCreated} Recipes</span>
              </div>
              <div className="stat-item">
                <Heart size={20} />
                <span>{stats.favoriteRecipes} Favorites</span>
              </div>
              <div className="stat-item">
                <span>{stats.commentsPosted} Comments</span>
              </div>
            </div>
          </div>

          <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
            <Edit size={20} />
            <span className="edit-text">Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="profile-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-name">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            {user?.dietaryPreferences && user.dietaryPreferences.length > 0 && (
              <div className="profile-section">
                <h3>Dietary Preferences</h3>
                <div className="dietary-tags">
                  {user.dietaryPreferences.map((preference) => (
                    <span key={preference} className="dietary-tag">
                      {dietaryOptionsMap[preference] || preference}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="profile-section">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <span>📝 Created {stats.recipesCreated} recipes</span>
                </div>
                <div className="activity-item">
                  <span>❤️ Favorited {stats.favoriteRecipes} recipes</span>
                </div>
                <div className="activity-item">
                  <span>💬 Posted {stats.commentsPosted} comments</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "my-recipes" && (
          <div className="my-recipes-tab">
            <div className="section-header">
              <h3>My Recipes ({userRecipes.length})</h3>
            </div>
            {userRecipes.length === 0 ? (
              <div className="empty-state">
                <p>You haven't created any recipes yet.</p>
              </div>
            ) : (
              <div className="recipe-grid-responsive">
                {userRecipes.map((recipe) => (
                  <div key={recipe.id} className="recipe-card-profile">
                    <div className="recipe-image-small">
                      <img src={recipe.imageUrl || `/placeholder.svg?height=150&width=200`} alt={recipe.title} />
                    </div>
                    <div className="recipe-info-profile">
                      <h4>{recipe.title}</h4>
                      <p>
                        {recipe.category} • {recipe.cookingTime} min
                      </p>
                      <div className="recipe-actions-profile">
                        <button className="edit-recipe-btn" onClick={() => setEditingRecipe(recipe)}>
                          <Edit size={16} />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="favorites-tab">
            <div className="section-header">
              <h3>Favorite Recipes ({favoriteRecipes.length})</h3>
            </div>
            {favoriteRecipes.length === 0 ? (
              <div className="empty-state">
                <p>You haven't favorited any recipes yet.</p>
              </div>
            ) : (
              <div className="recipe-grid-responsive">
                {favoriteRecipes.map((recipe) => (
                  <div key={recipe.id} className="recipe-card-profile">
                    <div className="recipe-image-small">
                      <img src={recipe.imageUrl || `/placeholder.svg?height=150&width=200`} alt={recipe.title} />
                    </div>
                    <div className="recipe-info-profile">
                      <h4>{recipe.title}</h4>
                      <p>
                        {recipe.category} • {recipe.cookingTime} min
                      </p>
                      <p className="recipe-author">by {recipe.createdBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="close-btn" onClick={() => setIsEditing(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="profile-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={profileData.username}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="profilePicture">Profile Picture URL</label>
                <input
                  type="url"
                  id="profilePicture"
                  value={profileData.profilePicture}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      profilePicture: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Dietary Preferences</label>
                <div className="dietary-preferences">
                  {dietaryOptions.map((option) => (
                    <label key={option.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={profileData.dietaryPreferences.includes(option.id)}
                        onChange={() => handleDietaryChange(option.id)}
                      />
                      {option.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Recipe Modal */}
      {editingRecipe && <RecipeForm recipe={editingRecipe} onClose={() => setEditingRecipe(null)} />}
    </div>
  )
}
