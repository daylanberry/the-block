import { useEffect, useId, useState } from 'react'

import './VehicleGallery.css'

interface VehicleGalleryProps {
  vehicleId: string
  vehicleName: string
  lot: string
  images: readonly string[]
}

export function VehicleGallery({
  vehicleId,
  vehicleName,
  lot,
  images,
}: VehicleGalleryProps) {
  const titleId = useId()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [failedIndexes, setFailedIndexes] = useState(() => new Set<number>())
  const selectedImage = images[selectedIndex]
  const selectedImageFailed = failedIndexes.has(selectedIndex)
  const hasSelectedImage = selectedImage !== undefined && !selectedImageFailed
  const selectedPhotoNumber = images.length === 0 ? 0 : selectedIndex + 1

  useEffect(() => {
    setSelectedIndex(0)
    setFailedIndexes(new Set())
  }, [vehicleId])

  function markImageFailed(index: number) {
    setFailedIndexes((current) => {
      const next = new Set(current)
      next.add(index)
      return next
    })
  }

  return (
    <section className="vehicle-gallery" aria-labelledby={titleId}>
      <header className="vehicle-gallery__header">
        <div>
          <p className="eyebrow">Image record</p>
          <h2 id={titleId}>Vehicle photography</h2>
        </div>
        <p aria-live="polite" aria-atomic="true">
          <strong>{String(selectedPhotoNumber).padStart(2, '0')}</strong>
          <span aria-hidden="true"> / </span>
          {String(images.length).padStart(2, '0')}
        </p>
      </header>

      <figure className="vehicle-gallery__figure">
        <div className="vehicle-gallery__primary">
          {hasSelectedImage ? (
            <img
              src={selectedImage}
              alt={`${vehicleName}, photo ${selectedPhotoNumber} of ${images.length}`}
              decoding="async"
              fetchPriority="high"
              onError={() => markImageFailed(selectedIndex)}
            />
          ) : (
            <div
              className="vehicle-gallery__fallback"
              role="img"
              aria-label={`Photo unavailable for ${vehicleName}, lot ${lot}`}
            >
              <span>Image unavailable</span>
              <strong>{lot}</strong>
              <small>Inspection photo record</small>
            </div>
          )}
        </div>
        <figcaption>
          <span>Lot {lot}</span>
          <span>
            {images.length === 0
              ? 'No supplied photography'
              : `Photo ${selectedPhotoNumber} of ${images.length}`}
          </span>
        </figcaption>
      </figure>

      {images.length > 1 ? (
        <div className="vehicle-gallery__thumbnails" aria-label="Vehicle photos">
          {images.map((image, index) => {
            const isFailed = failedIndexes.has(index)
            const isSelected = selectedIndex === index

            return (
              <button
                key={`${image}-${index}`}
                className={isSelected ? 'is-selected' : undefined}
                type="button"
                aria-label={`View photo ${index + 1} of ${images.length}`}
                aria-pressed={isSelected}
                onClick={() => setSelectedIndex(index)}
              >
                {isFailed ? (
                  <span
                    className="vehicle-gallery__thumbnail-fallback"
                    aria-hidden="true"
                  >
                    No image
                  </span>
                ) : (
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={() => markImageFailed(index)}
                  />
                )}
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
