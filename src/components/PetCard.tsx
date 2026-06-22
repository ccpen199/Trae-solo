import { Link } from 'react-router-dom'
import { ShieldCheck, Scissors } from 'lucide-react'

interface PetCardProps {
  pet: {
    id: number
    name: string
    breed?: string
    age?: string
    species?: string
    avatar?: string
    vaccinated?: boolean
    sterilized?: boolean
  }
}

export default function PetCard({ pet }: PetCardProps) {
  const species = pet.species || 'dog'
  const imgSrc = pet.avatar || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20${species}%20pet%20portrait&image_size=square`

  return (
    <Link
      to={`/pets/${pet.id}`}
      className="block bg-white rounded-2xl overflow-hidden card-hover shadow-sm"
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={imgSrc}
          alt={pet.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-text-primary text-base">{pet.name}</h3>
        {(pet.breed || pet.age) && (
          <p className="text-sm text-text-secondary mt-0.5">
            {[pet.breed, pet.age].filter(Boolean).join(' · ')}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          {pet.vaccinated && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-success/10 text-success text-xs rounded-full font-medium">
              <ShieldCheck className="w-3 h-3" />
              已免疫
            </span>
          )}
          {pet.sterilized && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-secondary-50 text-secondary text-xs rounded-full font-medium">
              <Scissors className="w-3 h-3" />
              已绝育
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
