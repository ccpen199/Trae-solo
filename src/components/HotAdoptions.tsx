import { Link } from 'react-router-dom'
import { ArrowRight, Award } from 'lucide-react'
import PetCard from '@/components/PetCard'

const mockAdoptionPets = [
  { id: 1, name: '小白', breed: '萨摩耶', age: '2岁', species: 'dog', vaccinated: true, sterilized: true },
  { id: 2, name: '橘座', breed: '橘猫', age: '1岁', species: 'cat', vaccinated: true, sterilized: false },
  { id: 3, name: '大毛', breed: '金毛寻回犬', age: '3岁', species: 'dog', vaccinated: true, sterilized: true },
  { id: 4, name: '花花', breed: '英短蓝猫', age: '8个月', species: 'cat', vaccinated: true, sterilized: false },
  { id: 5, name: '豆豆', breed: '柯基犬', age: '1.5岁', species: 'dog', vaccinated: false, sterilized: true },
]

export default function HotAdoptions() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="heading-font text-2xl font-bold text-text-primary">热门领养</h2>
        <Link to="/adoptions" className="flex items-center gap-1 text-primary text-sm font-medium hover:gap-2 transition-all">
          查看更多 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
        {mockAdoptionPets.map((pet) => (
          <div key={pet.id} className="min-w-[200px] max-w-[200px] snap-start">
            <PetCard pet={pet} />
          </div>
        ))}
      </div>
    </section>
  )
}
