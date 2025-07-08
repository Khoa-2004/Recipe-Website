"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import DietaryPreferencesModal from "./DietaryPreferencesModal"
import { useTheme } from "../contexts/ThemeContext"
import { Sun, Moon } from "lucide-react"

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
  const { login, register, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const { theme, toggleTheme } = useTheme()

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    setErrors({})
    if (isLogin) {
      try {
        await login(formData.email, formData.password)
        setLoading(false)
        onLogin()
      } catch (err) {
        setLoading(false)
        setErrors({ general: err.message })
      }
    } else {
      try {
        // Register user (dietaryPreferences will be set after modal)
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          profilePicture: formData.profilePicture || "",
          dietaryPreferences: [],
        })
        setShowDietaryModal(true)
        setPendingUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          profilePicture: formData.profilePicture || "",
        })
        setLoading(false)
      } catch (err) {
        setLoading(false)
        setErrors({ email: err.message })
      }
    }
  }

  const handleDietaryPreferencesSave = async (preferences) => {
    try {
      await updateProfile({ dietaryPreferences: preferences })
      setShowDietaryModal(false)
      onLogin()
    } catch (err) {
      setErrors({ general: err.message })
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
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
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', zIndex: 2 }}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          </button>
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
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Login" : "Create Account"}
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
