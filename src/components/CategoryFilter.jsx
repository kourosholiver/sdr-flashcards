import { getTypeMeta } from '../utils/notion'
import './CategoryFilter.css'

export default function CategoryFilter({ categories, selected, onChange, counts }) {
  return (
    <div className="filter-wrap">
      <div className="filter-scroll">
        <button
          className={`filter-btn ${selected === 'All' ? 'filter-btn--active' : ''}`}
          onClick={() => onChange('All')}
        >
          All
          {counts?.All != null && (
            <span className="filter-count">{counts.All}</span>
          )}
        </button>
        {categories.map(cat => {
          const meta = getTypeMeta(cat)
          const isActive = selected === cat
          return (
            <button
              key={cat}
              className={`filter-btn ${isActive ? 'filter-btn--active' : ''}`}
              style={isActive ? { color: meta.color, background: meta.bg, borderColor: meta.color + '40' } : {}}
              onClick={() => onChange(cat)}
            >
              {meta.label}
              {counts?.[cat] != null && (
                <span className="filter-count">{counts[cat]}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
