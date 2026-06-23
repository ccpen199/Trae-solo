import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PetPhotoCarouselProps {
  images: string[]
  petName: string
  defaultImage: string
}

export default function PetPhotoCarousel({ images, petName, defaultImage }: PetPhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const allImages = images.length > 0 ? images : [defaultImage]

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-stone-100">
      <div className="aspect-[4/3] relative">
        <img
          src={allImages[currentIndex]}
          alt={`${petName} - 照片 ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
        {allImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition"
            >
              <ChevronLeft className="w-5 h-5 text-text-primary" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition"
            >
              <ChevronRight className="w-5 h-5 text-text-primary" />
            </button>
          </>
        )}
      </div>
      {allImages.length > 1 && (
        <div className="flex justify-center gap-2 p-4">
          {allImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition ${
                index === currentIndex ? 'bg-primary w-6' : 'bg-stone-300 hover:bg-stone-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
