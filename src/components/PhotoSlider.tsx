import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const photos = [
  "/images/photo1.jpg",
];

const PhotoSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (photos.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  if (photos.length === 0) return null;

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-black/10">
      <div
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {photos.map((photo, index) => (
          <div
            key={index}
            className="min-w-full h-full flex items-center justify-center"
          >
            <img
              src={photo}
              alt={`Foto ${index + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PhotoSlider;
