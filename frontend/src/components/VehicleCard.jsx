import { Link } from 'react-router-dom'

function VehicleCard({ vehicle }) {
  const { id, make, model, type, city, price_per_day, photos } = vehicle
  const firstPhoto = photos?.[0]

  return (
    <li className="vehicle-card">
      <article>
        <h2 className="vehicle-card__heading">
          {make} {model}
        </h2>

        {firstPhoto && <img src={firstPhoto} alt={`${make} ${model}`} />}

        <span className="vehicle-card__type">{type}</span>
        <span className="vehicle-card__city">{city}</span>
        <span className="vehicle-card__price">LKR {price_per_day}/day</span>

        <Link to={`/vehicles/${id}`} className="vehicle-card__link">
          View & book
        </Link>
      </article>
    </li>
  )
}

export default VehicleCard
