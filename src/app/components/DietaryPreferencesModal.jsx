"use client"

import { useState } from "react"
import { X, Check } from "lucide-react"

export default function DietaryPreferencesModal({ isOpen, onClose, onSave, initialPreferences = [] }) {
  const [selectedPreferences, setSelectedPreferences] = useState(initialPreferences)

  const dietaryOptions = [
    {
      id: "vegetarian",
      name: "Vegetarian",
      description: "No meat, but may include dairy and eggs",
      icon: "🥬",
    },
    {
      id: "vegan",
      name: "Vegan",
      description: "No animal products whatsoever",
      icon: "🌱",
    },
    {
      id: "gluten-free",
      name: "Gluten-Free",
      description: "No wheat, barley, rye, or other gluten-containing grains",
      icon: "🌾",
    },
    {
      id: "dairy-free",
      name: "Dairy-Free",
      description: "No milk, cheese, butter, or other dairy products",
      icon: "🥛",
    },
    {
      id: "keto",
      name: "Keto",
      description: "Very low carb, high fat diet",
      icon: "🥑",
    },
    {
      id: "low-carb",
      name: "Low-Carb",
      description: "Reduced carbohydrate intake",
      icon: "🥩",
    },
    {
      id: "high-protein",
      name: "High-Protein",
      description: "Emphasis on protein-rich foods",
      icon: "💪",
    },
    {
      id: "low-sodium",
      name: "Low-Sodium",
      description: "Reduced salt and sodium intake",
      icon: "🧂",
    },
  ]

  const handlePreferenceToggle = (preferenceId) => {
    setSelectedPreferences((prev) =>
      prev.includes(preferenceId) ? prev.filter((id) => id !== preferenceId) : [...prev, preferenceId],
    )
  }

  const handleSave = () => {
    onSave(selectedPreferences)
    onClose()
  }

  const handleSkip = () => {
    onSave([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay dietary-modal-overlay">
      <div className="modal-content dietary-modal">
        <div className="dietary-modal-header">
          <div className="header-content">
            <h2>🍽️ Choose Your Dietary Preferences</h2>
            <p>Help us personalize your recipe recommendations</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="dietary-modal-body">
          <div className="dietary-options-grid">
            {dietaryOptions.map((option) => (
              <div
                key={option.id}
                className={`dietary-option ${selectedPreferences.includes(option.id) ? "selected" : ""}`}
                onClick={() => handlePreferenceToggle(option.id)}
              >
                <div className="option-header">
                  <div className="option-icon">{option.icon}</div>
                  <div className="option-info">
                    <h3>{option.name}</h3>
                    <p>{option.description}</p>
                  </div>
                  <div className="option-checkbox">
                    {selectedPreferences.includes(option.id) && <Check size={20} />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="selection-summary">
            {selectedPreferences.length > 0 ? (
              <p>
                <strong>{selectedPreferences.length}</strong> preference{selectedPreferences.length !== 1 ? "s" : ""}{" "}
                selected
              </p>
            ) : (
              <p>No preferences selected - you can always change this later in your profile</p>
            )}
          </div>
        </div>

        <div className="dietary-modal-footer">
          <button className="skip-btn" onClick={handleSkip}>
            Skip for Now
          </button>
          <button className="save-preferences-btn" onClick={handleSave}>
            {selectedPreferences.length > 0 ? "Save Preferences" : "Continue Without Preferences"}
          </button>
        </div>
      </div>
    </div>
  )
}
