"use client"

import { useState, useEffect, Suspense, lazy } from "react"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { RecipeProvider, useRecipes } from "./contexts/RecipeContext"
import { ThemeProvider } from "./contexts/ThemeContext"

import Header from "./components/Header"
import LoginForm from "./components/LoginForm"
import RecipeList from "./components/RecipeList"
import RecipeForm from "./components/RecipeForm"
import MealPlanner from "./components/MealPlanner"
import ProfilePage from "./components/ProfilePage"
import RecipeModal from "./components/RecipeModal"
import "./globals.css"

const LazyRecipeList = lazy(() => import("./components/RecipeList"))
const LazyMealPlanner = lazy(() => import("./components/MealPlanner"))
const LazyProfilePage = lazy(() => import("./components/ProfilePage"))
const LazyRecipeForm = lazy(() => import("./components/RecipeForm"))
const LazyRecipeModal = lazy(() => import("./components/RecipeModal"))

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
            <NotificationsWrapper
              currentView={currentView}
              setCurrentView={setCurrentView}
              onLogout={handleLogout}
              onAddRecipe={() => setShowRecipeForm(true)}
              showRecipeForm={showRecipeForm}
              setShowRecipeForm={setShowRecipeForm}
              sharedRecipe={sharedRecipe}
              closeSharedRecipe={closeSharedRecipe}
            />
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

// --- Notification logic wrapper ---
function NotificationsWrapper({
  currentView,
  setCurrentView,
  onLogout,
  onAddRecipe,
  showRecipeForm,
  setShowRecipeForm,
  sharedRecipe,
  closeSharedRecipe,
}) {
  const { user } = useAuth() || {}
  const { recipes } = useRecipes() || {}
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)

  // Listen for new comments on user's recipes
  useEffect(() => {
    if (!user || !recipes) return
    // Find all recipes created by the current user
    const myRecipes = recipes.filter(r => r.createdBy === user.username)
    // Gather all comments on my recipes not by me
    let newNotifs = []
    myRecipes.forEach(recipe => {
      recipe.comments?.forEach(comment => {
        if (comment.username !== user.username) {
          const notifId = `${recipe.id}-${comment.id}`
          if (!notifications.some(n => n.id === notifId)) {
            newNotifs.push({
              id: notifId,
              message: `${comment.username} commented on your recipe "${recipe.title}"`,
              read: false,
              timestamp: comment.timestamp
            })
          }
        }
      })
    })
    if (newNotifs.length > 0) {
      setNotifications(prev => [...prev, ...newNotifs])
    }
    // Optionally, remove notifications for deleted comments/recipes
    setNotifications(prev => prev.filter(n =>
      recipes.some(r => r.id === Number(n.id.split('-')[0]) &&
        r.comments?.some(c => c.id === n.id.split('-')[1])
      )
    ))
  }, [recipes, user])

  // Mark notifications as read when dropdown is opened
  const handleNotifClick = () => {
    setNotifOpen(v => !v)
    if (!notifOpen) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  return (
    <div className="app">
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={onLogout}
        onAddRecipe={onAddRecipe}
        notifications={notifications}
        onNotifClick={handleNotifClick}
      />
      <main className="main-content">
        <Suspense fallback={<div className="loading-container"><div className="loading-spinner"></div>Loading...</div>}>
          {currentView === "recipes" && <LazyRecipeList />}
          {currentView === "meal-planner" && <LazyMealPlanner />}
          {currentView === "profile" && <LazyProfilePage />}
        </Suspense>
      </main>
      {showRecipeForm && (
        <Suspense fallback={<div className="loading-container"><div className="loading-spinner"></div>Loading...</div>}>
          <LazyRecipeForm onClose={() => setShowRecipeForm(false)} />
        </Suspense>
      )}
      {sharedRecipe && (
        <Suspense fallback={<div className="loading-container"><div className="loading-spinner"></div>Loading...</div>}>
          <LazyRecipeModal recipe={sharedRecipe} onClose={closeSharedRecipe} />
        </Suspense>
      )}
    </div>
  )
}
