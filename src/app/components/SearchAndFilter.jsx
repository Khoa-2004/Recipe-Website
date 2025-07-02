"use client"

import { useRecipes } from "../contexts/RecipeContext"
import { Search, Filter } from "lucide-react"

export default function SearchAndFilter() {
  const { searchTerm, setSearchTerm, filterCategory, setFilterCategory, sortBy, setSortBy } = useRecipes()

  const categories = ["All", "Breakfast", "Lunch", "Dinner", "Dessert", "Snack"]
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "rating", label: "Highest Rated" },
    { value: "alphabetical", label: "A-Z" },
  ]

  return (
    <div className="search-filter-container">
      <div className="search-bar">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search recipes, ingredients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filters">
        <div className="filter-group">
          <Filter size={16} />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
