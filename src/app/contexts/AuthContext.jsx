"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const AuthContext = createContext()
const API_URL = "http://localhost:3001"

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = async (email, password) => {
    if (typeof email !== "string" || typeof password !== "string") {
      throw new Error("Email and password must be strings");
    }
    const normalizedEmail = email.trim().toLowerCase();
    const res = await axios.get(`${API_URL}/users?email=${encodeURIComponent(normalizedEmail)}&password=${encodeURIComponent(password)}`);
    if (res.data.length === 0) {
      throw new Error("Invalid email or password");
    }
    setUser(res.data[0]);
    localStorage.setItem("currentUser", JSON.stringify(res.data[0]));
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
  }

  const updateProfile = async (updatedData) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedData };
    const response = await axios.patch(`${API_URL}/users/${user.id}`, updatedData);
    setUser(response.data);
    localStorage.setItem("currentUser", JSON.stringify(response.data));
    // If username changed, update all recipes created by the old username
    if (updatedData.username && updatedData.username !== user.username) {
      try {
        const recipesRes = await axios.get(`${API_URL}/recipes?createdBy=${encodeURIComponent(user.username)}`);
        const recipes = recipesRes.data;
        await Promise.all(
          recipes.map((recipe) =>
            axios.patch(`${API_URL}/recipes/${recipe.id}`, { createdBy: updatedData.username })
          )
        );
      } catch (err) {
        console.error("Failed to update recipes' createdBy after username change", err);
      }
    }
  };

  const register = async (userData) => {
    const email = userData.email.trim().toLowerCase();
    // Check if user already exists
    const res = await axios.get(`${API_URL}/users?email=${encodeURIComponent(email)}`);
    console.log("User check result:", res.data);
    if (res.data.length > 0) {
      throw new Error("User already exists");
    }
    // Register new user
    const response = await axios.post(`${API_URL}/users`, {
      ...userData,
      email, // store normalized email
      createdAt: new Date().toISOString(),
      dietaryPreferences: userData.dietaryPreferences || [],
    });
    setUser(response.data);
    localStorage.setItem("currentUser", JSON.stringify(response.data));
    await login(userData.email, userData.password);
  };

  const handleRegister = async (userData) => {
    try {
      await register(userData);
      await login(userData.email, userData.password);
      // ...success logic
    } catch (err) {
      // ...error logic
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        updateProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
