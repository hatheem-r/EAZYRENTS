function Skeleton({ count = 1, variant = 'block' }) {
  return (
    <>
      <p className="sr-only" role="status">
        Loading
      </p>

      {variant === 'card'
        ? Array.from({ length: count }).map((_, index) => (
            <div key={index} className="skeleton skeleton--card" aria-hidden="true" />
          ))
        : <div className="skeleton" aria-hidden="true" />}
    </>
  )
}

export default Skeleton
