"use client"

import { useState, useEffect } from "react"
import { useRecipes } from "../contexts/RecipeContext"
import { useAuth } from "../contexts/AuthContext"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Save, FolderOpen, Trash2, Calendar } from "lucide-react"
import axios from "axios"

const API_URL = "http://localhost:3001"

export default function MealPlanner() {
  const { recipes } = useRecipes()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("planner")
  const [mealPlan, setMealPlan] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  })
  const [availableRecipes, setAvailableRecipes] = useState([])
  const [savedMealPlans, setSavedMealPlans] = useState([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [planName, setPlanName] = useState("")

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  useEffect(() => {
    const savedMealPlan = localStorage.getItem("mealPlan")
    if (savedMealPlan) setMealPlan(JSON.parse(savedMealPlan))
    setAvailableRecipes(recipes)

    // Load saved meal plans
    if (user?.id) {
      axios.get(`${API_URL}/mealPlans?userId=${user.id}`)
        .then(res => setSavedMealPlans(res.data))
        .catch(() => setSavedMealPlans([]))
    }
  }, [recipes, user])

  useEffect(() => {
    localStorage.setItem("mealPlan", JSON.stringify(mealPlan))
  }, [mealPlan])

  const saveMealPlan = () => {
    if (!planName.trim()) return

    const newPlan = {
      id: Date.now(),
      name: planName.trim(),
      plan: { ...mealPlan },
      createdAt: new Date().toISOString(),
      userId: user?.id,
    }

    axios.post(`${API_URL}/mealPlans`, newPlan)
      .then(res => setSavedMealPlans(prev => [...prev, res.data]))
      .catch(err => {/* handle error */})

    setPlanName("")
    setShowSaveModal(false)
  }

  const loadMealPlan = (plan) => {
    setMealPlan(plan.plan)
    setActiveTab("planner")
  }

  const deleteSavedPlan = (planId) => {
    if (window.confirm("Are you sure you want to delete this meal plan?")) {
      axios.delete(`${API_URL}/mealPlans/${planId}`)
        .then(() => setSavedMealPlans(prev => prev.filter(plan => plan.id !== planId)))
        .catch(err => {/* handle error */})
    }
  }

  const onDragEnd = ({ destination, source, draggableId }) => {
    if (!destination) return

    const src = source.droppableId
    const dest = destination.droppableId

    // Parse the draggableId to get recipe info
    let recipeId, sourceDay, sourceIndex

    if (draggableId.startsWith("available-")) {
      // Dragging from available recipes
      recipeId = Number(draggableId.replace("available-", ""))
    } else {
      // Dragging from a day - format: "day-recipeId-index"
      const parts = draggableId.split("-")
      sourceDay = parts[0]
      recipeId = Number(parts[1])
      sourceIndex = Number(parts[2])
    }

    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe) return

    if (src === "available-recipes") {
      // Copy from available recipes to any day
      if (dest !== "available-recipes") {
        setMealPlan((prev) => ({
          ...prev,
          [dest]: [...prev[dest], recipe],
        }))
      }
    } else if (dest === "available-recipes") {
      // Remove from a day when dragged back to available recipes
      setMealPlan((prev) => ({
        ...prev,
        [src]: prev[src].filter((_, i) => i !== source.index),
      }))
    } else if (src !== dest) {
      // Copy between different days
      setMealPlan((prev) => ({
        ...prev,
        [dest]: [...prev[dest], recipe],
      }))
    } else {
      // Reorder within the same day
      setMealPlan((prev) => {
        const list = [...prev[src]]
        const [moved] = list.splice(source.index, 1)
        list.splice(destination.index, 0, moved)
        return { ...prev, [src]: list }
      })
    }
  }

  const calculateDayNutrition = (dayRecipes) => {
    return dayRecipes.reduce(
      (total, recipe) => ({
        calories: total.calories + recipe.nutritionalInfo.calories,
        protein: total.protein + recipe.nutritionalInfo.protein,
        fat: total.fat + recipe.nutritionalInfo.fat,
        carbs: total.carbs + recipe.nutritionalInfo.carbs,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 },
    )
  }

  const calculateWeekNutrition = () => {
    const weekTotal = { calories: 0, protein: 0, fat: 0, carbs: 0 }

    daysOfWeek.forEach((day) => {
      const dayNutrition = calculateDayNutrition(mealPlan[day])
      weekTotal.calories += dayNutrition.calories
      weekTotal.protein += dayNutrition.protein
      weekTotal.fat += dayNutrition.fat
      weekTotal.carbs += dayNutrition.carbs
    })

    return weekTotal
  }

  const weekNutrition = calculateWeekNutrition()

  const tabs = [
    { id: "planner", name: "Meal Planner", icon: <Calendar size={20} /> },
    { id: "saved", name: "Saved Plans", icon: <FolderOpen size={20} /> },
  ]

  return (
    <div className="meal-planner">
      <div className="meal-planner-header">
        <div className="header-content">
          <h2>Weekly Meal Planner</h2>
          <div className="header-actions">
            <button className="save-plan-btn" onClick={() => setShowSaveModal(true)}>
              <Save size={20} />
              <span>Save Plan</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="meal-planner-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {activeTab === "planner" && (
          <div className="week-nutrition">
            <h3>Week Total Nutrition</h3>
            <div className="nutrition-summary">
              <div className="nutrition-item">
                <span>Calories: {weekNutrition.calories}</span>
              </div>
              <div className="nutrition-item">
                <span>Protein: {weekNutrition.protein}g</span>
              </div>
              <div className="nutrition-item">
                <span>Fat: {weekNutrition.fat}g</span>
              </div>
              <div className="nutrition-item">
                <span>Carbs: {weekNutrition.carbs}g</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeTab === "planner" && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="meal-planner-content">
            <div className="available-recipes-section">
              <h3>Available Recipes</h3>
              <Droppable droppableId="available-recipes">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="available-recipes">
                    {availableRecipes.map((recipe, index) => (
                      <Draggable key={`available-${recipe.id}`} draggableId={`available-${recipe.id}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`recipe-item ${snapshot.isDragging ? "dragging" : ""}`}
                          >
                            <div className="recipe-info">
                              <h4>{recipe.title}</h4>
                              <p>
                                {recipe.category} • {recipe.cookingTime} min
                              </p>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            <div className="calendar-section">
              <div className="calendar-grid">
                {daysOfWeek.map((day) => {
                  const dayNutrition = calculateDayNutrition(mealPlan[day])

                  return (
                    <div key={day} className="day-column">
                      <div className="day-header">
                        <h3>{day}</h3>
                        <div className="day-nutrition">
                          <small>{dayNutrition.calories} cal</small>
                        </div>
                      </div>

                      <div className="day-content">
                        <Droppable droppableId={day}>
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`day-recipes ${snapshot.isDraggingOver ? "drag-over" : ""}`}
                            >
                              {mealPlan[day].map((recipe, index) => (
                                <Draggable
                                  key={`${day}-${recipe.id}-${index}`}
                                  draggableId={`${day}-${recipe.id}-${index}`}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`planned-recipe ${snapshot.isDragging ? "dragging" : ""}`}
                                    >
                                      <h4>{recipe.title}</h4>
                                      <p>{recipe.category}</p>
                                      <small>{recipe.nutritionalInfo.calories} cal</small>
                                      <button
                                        className="remove-recipe-btn"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setMealPlan((prev) => ({
                                            ...prev,
                                            [day]: prev[day].filter((_, i) => i !== index),
                                          }))
                                        }}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                              {mealPlan[day].length === 0 && <div className="empty-day">Drag recipes here</div>}
                            </div>
                          )}
                        </Droppable>

                        <button
                          className="clear-day-btn-small"
                          onClick={() => setMealPlan((prev) => ({ ...prev, [day]: [] }))}
                          disabled={mealPlan[day].length === 0}
                          title="Clear all recipes for this day"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </DragDropContext>
      )}

      {activeTab === "saved" && (
        <div className="saved-plans-section">
          <div className="section-header">
            <h3>Saved Meal Plans ({savedMealPlans.length})</h3>
          </div>

          {savedMealPlans.length === 0 ? (
            <div className="empty-state">
              <p>No saved meal plans yet. Create a meal plan and save it!</p>
            </div>
          ) : (
            <div className="saved-plans-grid">
              {savedMealPlans.map((plan) => (
                <div key={plan.id} className="saved-plan-card">
                  <div className="plan-header">
                    <h4>{plan.name}</h4>
                    <div className="plan-actions">
                      <button className="load-plan-btn" onClick={() => loadMealPlan(plan)} title="Load this plan">
                        <FolderOpen size={16} />
                      </button>
                      <button
                        className="delete-plan-btn"
                        onClick={() => deleteSavedPlan(plan.id)}
                        title="Delete this plan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="plan-preview">
                    <div className="plan-stats">
                      <span>
                        {Object.values(plan.plan).reduce((total, day) => total + day.length, 0)} recipes planned
                      </span>
                      <span>Created {new Date(plan.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="plan-days-preview">
                      {daysOfWeek.map((day) => (
                        <div key={day} className="day-preview">
                          <span className="day-name">{day.slice(0, 3)}</span>
                          <span className="day-count">{plan.plan[day].length}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Plan Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content save-plan-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Save Meal Plan</h3>
              <button className="close-btn" onClick={() => setShowSaveModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="planName">Plan Name</label>
                <input
                  type="text"
                  id="planName"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Enter a name for your meal plan..."
                  maxLength={50}
                />
              </div>

              <div className="plan-summary">
                <h4>Plan Summary</h4>
                <div className="summary-stats">
                  <span>{Object.values(mealPlan).reduce((total, day) => total + day.length, 0)} recipes planned</span>
                  <span>{weekNutrition.calories} total calories</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={saveMealPlan} disabled={!planName.trim()}>
                Save Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
