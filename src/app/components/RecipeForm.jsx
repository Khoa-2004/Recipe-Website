"use client"

import { useState } from "react"
import { useRecipes } from "../contexts/RecipeContext"
import { useAuth } from "../contexts/AuthContext"
import { X, Plus, Minus } from "lucide-react"

export default function RecipeForm({ recipe, onClose }) {
  const { addRecipe, updateRecipe } = useRecipes()
  const { user } = useAuth()
  const isEditing = !!recipe

  const [formData, setFormData] = useState({
    title: recipe?.title || "",
    description: recipe?.description || "",
    ingredients: recipe?.ingredients || [""],
    instructions: recipe?.instructions || "",
    cookingTime: recipe?.cookingTime || "",
    servings: recipe?.servings || "",
    category: recipe?.category || "Breakfast",
    dietaryTags: recipe?.dietaryTags || [],
    nutritionalInfo: recipe?.nutritionalInfo || {
      calories: "",
      protein: "",
      fat: "",
      carbs: "",
    },
    imageUrl: recipe?.imageUrl || "",
  })

  const [errors, setErrors] = useState({})

  const categories = ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"]

  const dietaryOptions = [
    { id: "vegetarian", name: "Vegetarian", icon: "\uD83E\uDD6C" },
    { id: "vegan", name: "Vegan", icon: "\uD83C\uDF31" },
    { id: "gluten-free", name: "Gluten-Free", icon: "\uD83C\uDF3E" },
    { id: "dairy-free", name: "Dairy-Free", icon: "\uD83E\uDD5B" },
    { id: "keto", name: "Keto", icon: "\uD83E\uDD51" },
    { id: "low-carb", name: "Low-Carb", icon: "\uD83E\uDD69" },
    { id: "high-protein", name: "High-Protein", icon: "\uD83D\uDCAA" },
    { id: "low-sodium", name: "Low-Sodium", icon: "\uD83E\uDDC2" },
  ]

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.cookingTime || formData.cookingTime <= 0) {
      newErrors.cookingTime = "Cooking time must be greater than 0"
    }

    if (!formData.servings || formData.servings <= 0) {
      newErrors.servings = "Servings must be greater than 0"
    }

    if (formData.ingredients.filter((ing) => ing.trim()).length === 0) {
      newErrors.ingredients = "At least one ingredient is required"
    }

    if (!formData.instructions.trim()) {
      newErrors.instructions = "Instructions are required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) return

    const recipeData = {
      ...formData,
      ingredients: formData.ingredients.filter((ing) => ing.trim()),
      cookingTime: Number.parseInt(formData.cookingTime),
      servings: Number.parseInt(formData.servings),
      nutritionalInfo: {
        calories: Number.parseInt(formData.nutritionalInfo.calories) || 0,
        protein: Number.parseInt(formData.nutritionalInfo.protein) || 0,
        fat: Number.parseInt(formData.nutritionalInfo.fat) || 0,
        carbs: Number.parseInt(formData.nutritionalInfo.carbs) || 0,
      },
      createdBy: user?.username || "anonymous",
    }

    if (isEditing) {
      updateRecipe(recipe.id, recipeData)
    } else {
      addRecipe(recipeData)
    }

    onClose()
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleNutritionChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      nutritionalInfo: {
        ...prev.nutritionalInfo,
        [name]: value,
      },
    }))
  }

  const handleDietaryTagToggle = (tagId) => {
    setFormData((prev) => ({
      ...prev,
      dietaryTags: prev.dietaryTags.includes(tagId)
        ? prev.dietaryTags.filter((id) => id !== tagId)
        : [...prev.dietaryTags, tagId],
    }))
  }

  const addIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, ""],
    }))
  }

  const removeIngredient = (index) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
  }

  const updateIngredient = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => (i === index ? value : ing)),
    }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content recipe-form-modal-enhanced" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? "Edit Recipe" : "Add New Recipe"}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="recipe-form-enhanced">
          <div className="form-group">
            <label htmlFor="title">Recipe Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={errors.title ? "error" : ""}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" value={formData.category} onChange={handleInputChange}>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cookingTime">Cooking Time (minutes) *</label>
              <input
                type="number"
                id="cookingTime"
                name="cookingTime"
                value={formData.cookingTime}
                onChange={handleInputChange}
                min="1"
                className={errors.cookingTime ? "error" : ""}
              />
              {errors.cookingTime && <span className="error-text">{errors.cookingTime}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="servings">Servings *</label>
              <input
                type="number"
                id="servings"
                name="servings"
                value={formData.servings}
                onChange={handleInputChange}
                min="1"
                className={errors.servings ? "error" : ""}
              />
              {errors.servings && <span className="error-text">{errors.servings}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Dietary Tags</label>
            <p className="dietary-tags-description">
              Select all that apply to help users find recipes that match their dietary needs
            </p>
            <div className="dietary-tags-grid">
              {dietaryOptions.map((option) => (
                <div
                  key={option.id}
                  className={`dietary-tag-option ${formData.dietaryTags.includes(option.id) ? "selected" : ""}`}
                  onClick={() => handleDietaryTagToggle(option.id)}
                >
                  <span className="tag-icon">{option.icon}</span>
                  <span className="tag-name">{option.name}</span>
                </div>
              ))}
            </div>
            {formData.dietaryTags.length > 0 && (
              <div className="selected-tags-preview">
                <p>
                  Selected: {formData.dietaryTags.length} tag{formData.dietaryTags.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Ingredients *</label>
            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-input">
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) => updateIngredient(index, e.target.value)}
                  placeholder="Enter ingredient"
                />
                {formData.ingredients.length > 1 && (
                  <button type="button" onClick={() => removeIngredient(index)} className="remove-ingredient-btn">
                    <Minus size={16} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addIngredient} className="add-ingredient-btn">
              <Plus size={16} />
              Add Ingredient
            </button>
            {errors.ingredients && <span className="error-text">{errors.ingredients}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="instructions">Instructions *</label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              rows={6}
              placeholder="Enter step-by-step instructions..."
              className={errors.instructions ? "error" : ""}
            />
            {errors.instructions && <span className="error-text">{errors.instructions}</span>}
          </div>

          <div className="nutrition-section">
            <h3>Nutritional Information (per serving)</h3>
            <div className="nutrition-inputs">
              <div className="form-group">
                <label htmlFor="calories">Calories</label>
                <input
                  type="number"
                  id="calories"
                  name="calories"
                  value={formData.nutritionalInfo.calories}
                  onChange={handleNutritionChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="protein">Protein (g)</label>
                <input
                  type="number"
                  id="protein"
                  name="protein"
                  value={formData.nutritionalInfo.protein}
                  onChange={handleNutritionChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="fat">Fat (g)</label>
                <input
                  type="number"
                  id="fat"
                  name="fat"
                  value={formData.nutritionalInfo.fat}
                  onChange={handleNutritionChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="carbs">Carbs (g)</label>
                <input
                  type="number"
                  id="carbs"
                  name="carbs"
                  value={formData.nutritionalInfo.carbs}
                  onChange={handleNutritionChange}
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl">Recipe Image URL</label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              placeholder="Paste an image URL (e.g., https://...)"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {isEditing ? "Update Recipe" : "Add Recipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
