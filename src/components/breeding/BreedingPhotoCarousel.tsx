import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Props {
  images: string[]
  petName: string
  defaultImage: string
}

export default function BreedingPhotoCarousel({ images, petName, defaultImage }: Props) {
  const allImages = images.length > 0 ? images : [defaultImage]
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const prev = () => setCurrent((c) => (c - 1 + allImages.length) % allImages.length)
  const next = () => setCurrent((c) => (c + 1) % allImages.length)

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
        <div className="relative aspect-[4/3]" onClick={() => setLightbox(true)}>
          <img
            src={allImages[current]}
            alt={`${petName} - ${current + 1}`}
            className="w-full h-full object-cover cursor-pointer"
          />
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
                    className={`w-2 h-2 rounded-full transition ${current === i ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        {allImages.length > 1 && (
          <div className="p-4 flex gap-2 overflow-x-auto">
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                  current === i ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
          <img src={allImages[current]} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  )
}
