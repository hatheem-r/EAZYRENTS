import { Link } from 'react-router-dom'
import { photoUrl } from '../utils/imageUrl.js'
import VehicleArt from './VehicleArt.jsx'

function VehicleCard({ vehicle }) {
  const { id, make, model, type, city, price_per_day, photos } = vehicle
  const firstPhoto = photos?.[0]

  return (
    <li className="vehicle-card">
      <article className="vehicle-card__article">
        <div className="vehicle-card__media">
          {firstPhoto ? (
            <img src={photoUrl(firstPhoto)} alt={`${make} ${model}`} />
          ) : (
            <div className="vehicle-card__placeholder">
              <VehicleArt type={type} />
            </div>
          )}
          <span className="vehicle-card__type">{type}</span>
        </div>

        <div className="vehicle-card__body">
          <h2 className="vehicle-card__heading">
            {make} {model}
          </h2>
          <p className="vehicle-card__city">{city}</p>

          <div className="vehicle-card__footer">
            <p className="vehicle-card__price">
              LKR {price_per_day}
              <span className="vehicle-card__price-unit">/day</span>
            </p>
            <Link
              to={`/vehicles/${id}`}
              className="btn btn--primary btn--small vehicle-card__link"
              aria-label={`View and book ${make} ${model}`}
            >
              View &amp; book
            </Link>
          </div>
        </div>
      </article>
    </li>
  )
}

export default VehicleCard
