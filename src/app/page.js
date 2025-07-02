"use client"

import { useState, useEffect } from "react"
import { AuthProvider } from "./contexts/AuthContext"
import { RecipeProvider } from "./contexts/RecipeContext"
import { ThemeProvider } from "./contexts/ThemeContext"

import Header from "./components/Header"
import LoginForm from "./components/LoginForm"
import RecipeList from "./components/RecipeList"
import RecipeForm from "./components/RecipeForm"
import MealPlanner from "./components/MealPlanner"
import ProfilePage from "./components/ProfilePage"
import RecipeModal from "./components/RecipeModal"
import "./globals.css"

export default function App() {
  const [currentView, setCurrentView] = useState("recipes")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showRecipeForm, setShowRecipeForm] = useState(false)
  const [sharedRecipe, setSharedRecipe] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) setIsAuthenticated(true)

    // Check for shared recipe in URL
    const urlParams = new URLSearchParams(window.location.search)
    const recipeId = urlParams.get("recipe")
    if (recipeId) {
      // Find the recipe and show it
      const savedRecipes = localStorage.getItem("recipes")
      if (savedRecipes) {
        const recipes = JSON.parse(savedRecipes)
        const recipe = recipes.find((r) => r.id === Number.parseInt(recipeId))
        if (recipe) {
          setSharedRecipe(recipe)
        }
      }
    }
  }, [])

  const handleLogin = () => setIsAuthenticated(true)

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    setIsAuthenticated(false)
    setCurrentView("recipes")
  }

  const closeSharedRecipe = () => {
    setSharedRecipe(null)
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        {isAuthenticated ? (
          <RecipeProvider>
            <div className="app">
              <Header
                currentView={currentView}
                setCurrentView={setCurrentView}
                onLogout={handleLogout}
                onAddRecipe={() => setShowRecipeForm(true)}
              />

              <main className="main-content">
                {currentView === "recipes" && <RecipeList />}
                {currentView === "meal-planner" && <MealPlanner />}
                {currentView === "profile" && <ProfilePage />}
              </main>

              {showRecipeForm && <RecipeForm onClose={() => setShowRecipeForm(false)} />}
              {sharedRecipe && <RecipeModal recipe={sharedRecipe} onClose={closeSharedRecipe} />}
            </div>
          </RecipeProvider>
        ) : (
          <div className="app">
            <LoginForm onLogin={handleLogin} />
            {sharedRecipe && <RecipeModal recipe={sharedRecipe} onClose={closeSharedRecipe} />}
          </div>
        )}
      </AuthProvider>
    </ThemeProvider>
  )
}
