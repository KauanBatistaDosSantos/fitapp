import { useEffect, useState } from "react";

type TrainingMediaGalleryProps = {
  exerciseName: string;
  urls: string[];
  variant?: "compact" | "detail" | "catalog";
};

export function TrainingMediaGallery({
  exerciseName,
  urls,
  variant = "detail",
}: TrainingMediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const visibleUrls = variant === "compact" ? urls.slice(0, 3) : urls;
  const selectedUrl = selectedIndex == null ? undefined : urls[selectedIndex];

  useEffect(() => {
    if (selectedIndex == null) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedIndex(null);
      if (event.key === "ArrowLeft") {
        setSelectedIndex((current) =>
          current == null ? current : (current - 1 + urls.length) % urls.length,
        );
      }
      if (event.key === "ArrowRight") {
        setSelectedIndex((current) =>
          current == null ? current : (current + 1) % urls.length,
        );
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIndex, urls.length]);

  const showPrevious = () => {
    setSelectedIndex((current) =>
      current == null ? current : (current - 1 + urls.length) % urls.length,
    );
  };
  const showNext = () => {
    setSelectedIndex((current) =>
      current == null ? current : (current + 1) % urls.length,
    );
  };

  return (
    <>
      <div className={`training-mediaGallery training-mediaGallery--${variant}`}>
        {visibleUrls.map((url, index) => (
          <button
            key={url}
            type="button"
            onClick={() => setSelectedIndex(index)}
            aria-label={`Abrir imagem ${index + 1} de ${exerciseName}`}
            title="Abrir imagem no app"
          >
            <img
              src={url}
              alt={`${exerciseName} — referência ${index + 1}`}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {variant === "compact" &&
              index === visibleUrls.length - 1 &&
              urls.length > visibleUrls.length && (
                <span className="training-mediaGallery__more">
                  +{urls.length - visibleUrls.length}
                </span>
              )}
          </button>
        ))}
      </div>

      {selectedUrl && selectedIndex != null && (
        <div
          className="training-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Imagem de ${exerciseName}`}
          onClick={() => setSelectedIndex(null)}
        >
          <div className="training-lightbox__header" onClick={(event) => event.stopPropagation()}>
            <div>
              <strong>{exerciseName}</strong>
              <span>
                Imagem {selectedIndex + 1} de {urls.length}
              </span>
            </div>
            <button
              type="button"
              className="training-lightbox__close"
              onClick={() => setSelectedIndex(null)}
              aria-label="Fechar imagem"
            >
              ×
            </button>
          </div>

          <div className="training-lightbox__stage" onClick={(event) => event.stopPropagation()}>
            {urls.length > 1 && (
              <button
                type="button"
                className="training-lightbox__nav training-lightbox__nav--previous"
                onClick={showPrevious}
                aria-label="Imagem anterior"
              >
                ‹
              </button>
            )}
            <img src={selectedUrl} alt={`${exerciseName} — referência ampliada`} referrerPolicy="no-referrer" />
            {urls.length > 1 && (
              <button
                type="button"
                className="training-lightbox__nav training-lightbox__nav--next"
                onClick={showNext}
                aria-label="Próxima imagem"
              >
                ›
              </button>
            )}
          </div>

          {urls.length > 1 && (
            <div className="training-lightbox__thumbs" onClick={(event) => event.stopPropagation()}>
              {urls.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  className={index === selectedIndex ? "training-lightbox__thumb--active" : ""}
                  onClick={() => setSelectedIndex(index)}
                  aria-label={`Mostrar imagem ${index + 1}`}
                >
                  <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.training-mediaGallery {
  width: 100%;
  height: 100%;
  display: grid;
  gap: 2px;
}
.training-mediaGallery > button {
  position: relative;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: rgba(148, 163, 184, 0.12);
  cursor: zoom-in;
}
.training-mediaGallery > button img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 0.18s ease;
}
.training-mediaGallery > button:hover img {
  transform: scale(1.04);
}
.training-mediaGallery--compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
}
.training-mediaGallery--compact > button:only-child {
  grid-column: 1 / -1;
  grid-row: 1 / -1;
}
.training-mediaGallery--compact > button:first-child:nth-last-child(2),
.training-mediaGallery--compact > button:first-child:nth-last-child(2) ~ button {
  grid-row: 1 / -1;
}
.training-mediaGallery--compact > button:first-child:nth-last-child(3) {
  grid-row: 1 / -1;
}
.training-mediaGallery--detail {
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  height: auto;
}
.training-mediaGallery--detail > button {
  aspect-ratio: 4 / 3;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 12px;
}
.training-mediaGallery--catalog {
  display: flex;
  gap: 7px;
  overflow-x: auto;
  padding: 2px 0;
}
.training-mediaGallery--catalog > button {
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 9px;
}
.training-mediaGallery__more {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.58);
  color: white;
  font-size: 0.8rem;
  font-weight: 800;
}
.training-lightbox {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 16px;
  padding: 18px;
  background: rgba(3, 7, 18, 0.94);
  color: white;
}
.training-lightbox__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.training-lightbox__header > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.training-lightbox__header span {
  color: #cbd5e1;
  font-size: 0.85rem;
}
.training-lightbox__close,
.training-lightbox__nav {
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(15, 23, 42, 0.78);
  color: white;
}
.training-lightbox__close {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  padding: 0;
  font-size: 1.8rem;
}
.training-lightbox__stage {
  position: relative;
  min-height: 0;
  display: grid;
  place-items: center;
}
.training-lightbox__stage > img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 14px;
}
.training-lightbox__nav {
  position: absolute;
  top: 50%;
  z-index: 1;
  width: 46px;
  height: 58px;
  border-radius: 12px;
  padding: 0;
  transform: translateY(-50%);
  font-size: 2rem;
}
.training-lightbox__nav--previous {
  left: 8px;
}
.training-lightbox__nav--next {
  right: 8px;
}
.training-lightbox__thumbs {
  display: flex;
  justify-content: center;
  gap: 8px;
  overflow-x: auto;
}
.training-lightbox__thumbs button {
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  padding: 0;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 9px;
  background: #111827;
}
.training-lightbox__thumbs button.training-lightbox__thumb--active {
  border-color: #60a5fa;
}
.training-lightbox__thumbs img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
@media (max-width: 640px) {
  .training-lightbox {
    padding: 12px;
  }
  .training-lightbox__nav {
    width: 40px;
    height: 52px;
  }
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}
