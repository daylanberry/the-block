import { useId, useLayoutEffect, useRef, useState } from "react";

import "./VehicleGallery.css";

interface VehicleGalleryProps {
  vehicleId: string;
  vehicleName: string;
  lot: string;
  images: readonly (string | null | undefined)[];
}

function isUsableImage(image: string | null | undefined): image is string {
  return typeof image === "string" && image.trim() !== "";
}

export function VehicleGallery({
  vehicleId,
  vehicleName,
  lot,
  images,
}: VehicleGalleryProps) {
  const titleId = useId();
  const previousVehicleId = useRef(vehicleId);
  const primaryImageRef = useRef<HTMLImageElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState(() => new Set<number>());
  const [loadedIndexes, setLoadedIndexes] = useState(() => new Set<number>());
  const usableImages = images.filter(isUsableImage);
  const selectedImage = usableImages[selectedIndex];
  const selectedImageFailed = failedIndexes.has(selectedIndex);
  const selectedImageLoaded = loadedIndexes.has(selectedIndex);
  const hasSelectedImage = selectedImage !== undefined && !selectedImageFailed;
  const selectedPhotoNumber = usableImages.length === 0 ? 0 : selectedIndex + 1;

  useLayoutEffect(() => {
    if (previousVehicleId.current === vehicleId) {
      return;
    }

    previousVehicleId.current = vehicleId;
    setSelectedIndex(0);
    setFailedIndexes(new Set());
    setLoadedIndexes(new Set());
  }, [vehicleId]);

  function markImageLoaded(index: number) {
    setLoadedIndexes((current) => {
      if (current.has(index)) {
        return current;
      }

      const next = new Set(current);
      next.add(index);
      return next;
    });
  }

  function markImageFailed(index: number) {
    setFailedIndexes((current) => {
      const next = new Set(current);
      next.add(index);
      return next;
    });
  }

  useLayoutEffect(() => {
    const image = primaryImageRef.current;

    if (image?.complete && image.naturalWidth > 0) {
      setLoadedIndexes((current) => {
        if (current.has(selectedIndex)) {
          return current;
        }

        const next = new Set(current);
        next.add(selectedIndex);
        return next;
      });
    }
  }, [selectedImage, selectedIndex]);

  return (
    <section className="vehicle-gallery" aria-labelledby={titleId}>
      <header className="vehicle-gallery__header">
        <div>
          <p className="eyebrow">Image record</p>
          <h2 id={titleId}>Vehicle photography</h2>
        </div>
        <p aria-live="polite" aria-atomic="true">
          <span aria-hidden="true">
            <strong>{String(selectedPhotoNumber).padStart(2, "0")}</strong> /{" "}
            {String(usableImages.length).padStart(2, "0")}
          </span>
          <span className="visually-hidden">
            {usableImages.length === 0
              ? "No supplied photos"
              : `Photo ${selectedPhotoNumber} of ${usableImages.length}`}
          </span>
        </p>
      </header>

      <figure className="vehicle-gallery__figure">
        <div className="vehicle-gallery__primary">
          {hasSelectedImage ? (
            <>
              {!selectedImageLoaded ? (
                <span className="vehicle-gallery__loading" aria-hidden="true">
                  Loading inspection photo
                </span>
              ) : null}
              <img
                ref={primaryImageRef}
                className={selectedImageLoaded ? "is-loaded" : undefined}
                src={selectedImage}
                alt={`${vehicleName}, photo ${selectedPhotoNumber} of ${usableImages.length}`}
                decoding="async"
                fetchPriority="high"
                onLoad={() => markImageLoaded(selectedIndex)}
                onError={() => markImageFailed(selectedIndex)}
              />
            </>
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
            {usableImages.length === 0
              ? "No supplied photography"
              : `Photo ${selectedPhotoNumber} of ${usableImages.length}`}
          </span>
        </figcaption>
      </figure>

      {usableImages.length > 1 ? (
        <div
          className="vehicle-gallery__thumbnails"
          role="group"
          aria-label="Vehicle photos"
        >
          {usableImages.map((image, index) => {
            const isFailed = failedIndexes.has(index);
            const isSelected = selectedIndex === index;

            return (
              <button
                key={`${image}-${index}`}
                className={isSelected ? "is-selected" : undefined}
                type="button"
                aria-label={`View photo ${index + 1} of ${usableImages.length}`}
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
                  {String(index + 1).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
