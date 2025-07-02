"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import DietaryPreferencesModal from "./DietaryPreferencesModal"

export default function LoginForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    profilePicture: "",
  })
  const [errors, setErrors] = useState({})
  const [showDietaryModal, setShowDietaryModal] = useState(false)
  const [pendingUser, setPendingUser] = useState(null)
  const { login } = useAuth()

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!isLogin && !formData.username) {
      newErrors.username = "Username is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) return

    if (isLogin) {
      // Mock login - in real app, this would validate against backend
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const user = users.find((u) => u.email === formData.email && u.password === formData.password)

      if (user) {
        login(user)
        onLogin()
      } else {
        setErrors({ general: "Invalid email or password" })
      }
    } else {
      // Register new user
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const existingUser = users.find((u) => u.email === formData.email)

      if (existingUser) {
        setErrors({ email: "User already exists" })
        return
      }

      const newUser = {
        id: Date.now(),
        username: formData.username,
        email: formData.email,
        password: formData.password,
        profilePicture: formData.profilePicture || "",
        createdAt: new Date().toISOString(),
        dietaryPreferences: [],
      }

      // Store the user temporarily and show dietary preferences modal
      setPendingUser(newUser)
      setShowDietaryModal(true)
    }
  }

  const handleDietaryPreferencesSave = (preferences) => {
    if (pendingUser) {
      const userWithPreferences = {
        ...pendingUser,
        dietaryPreferences: preferences,
      }

      const users = JSON.parse(localStorage.getItem("users") || "[]")
      users.push(userWithPreferences)
      localStorage.setItem("users", JSON.stringify(users))

      login(userWithPreferences)
      onLogin()
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      })
    }
  }

  return (
    <>
      <div className="login-container">
        <div className="login-form">
          <h2>{isLogin ? "Login" : "Create Account"}</h2>

          {errors.general && <div className="error-message">{errors.general}</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={errors.username ? "error" : ""}
                />
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "error" : ""}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "error" : ""}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="profilePicture">Profile Picture URL (optional)</label>
                <input
                  type="url"
                  id="profilePicture"
                  name="profilePicture"
                  value={formData.profilePicture}
                  onChange={handleChange}
                />
              </div>
            )}

            <button type="submit" className="submit-btn">
              {isLogin ? "Login" : "Create Account"}
            </button>
          </form>

          <p className="toggle-form">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" className="link-btn" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </div>

      <DietaryPreferencesModal
        isOpen={showDietaryModal}
        onClose={() => setShowDietaryModal(false)}
        onSave={handleDietaryPreferencesSave}
      />
    </>
  )
}
