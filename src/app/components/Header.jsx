"use client"

import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { Sun, Moon, User, Plus, Calendar, Home } from "lucide-react"

export default function Header({ currentView, setCurrentView, onLogout, onAddRecipe }) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="logo">RecipeShare</h1>
          <nav className="nav">
            <button
              className={`nav-button ${currentView === "recipes" ? "active" : ""}`}
              onClick={() => setCurrentView("recipes")}
            >
              <Home size={20} />
              Recipes
            </button>
            <button
              className={`nav-button ${currentView === "meal-planner" ? "active" : ""}`}
              onClick={() => setCurrentView("meal-planner")}
            >
              <Calendar size={20} />
              Meal Planner
            </button>
            <button
              className={`nav-button ${currentView === "profile" ? "active" : ""}`}
              onClick={() => setCurrentView("profile")}
            >
              <User size={20} />
              Profile
            </button>
          </nav>
        </div>

        <div className="header-right">
          <button className="add-recipe-btn" onClick={onAddRecipe}>
            <Plus size={20} />
            Add Recipe
          </button>

          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <div className="user-menu">
            <div className="user-info">
              {user?.profilePicture && (
                <img src={user.profilePicture || "/placeholder.svg"} alt="Profile" className="user-avatar" />
              )}
              <span className="username">{user?.username}</span>
            </div>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
