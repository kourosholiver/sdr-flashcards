import { RATINGS } from '../utils/sm2'
import './RatingButtons.css'

export default function RatingButtons({ onRate }) {
  return (
    <div className="ratings">
      <p className="ratings-label">How well did you know this?</p>
      <div className="ratings-grid">
        {RATINGS.map(({ label, quality, color, bg, description }) => (
          <button
            key={quality}
            className="rating-btn"
            style={{ '--btn-color': color, '--btn-bg': bg }}
            onClick={() => onRate(quality)}
            title={description}
          >
            <span className="rating-label">{label}</span>
            <span className="rating-desc">{description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
