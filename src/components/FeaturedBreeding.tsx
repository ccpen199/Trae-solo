import { Link } from 'react-router-dom'
import { ArrowRight, Award } from 'lucide-react'

const mockBreedings = [
  {
    id: 1,
    breed: '金毛寻回犬',
    petName: 'Lucky',
    age: '3岁',
    pedigree: true,
    healthCert: true,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=majestic%20golden%20retriever%20standing%20proud&image_size=square_hd',
  },
  {
    id: 2,
    breed: '拉布拉多犬',
    petName: 'Max',
    age: '2岁',
    pedigree: true,
    healthCert: true,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handsome%20labrador%20retriever%20portrait&image_size=square_hd',
  },
  {
    id: 3,
    breed: '柯基犬',
    petName: '短腿',
    age: '2岁',
    pedigree: false,
    healthCert: true,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20corgi%20standing%20smiling&image_size=square_hd',
  },
  {
    id: 4,
    breed: '边境牧羊犬',
    petName: '聪聪',
    age: '1.5岁',
    pedigree: true,
    healthCert: true,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=intelligent%20border%20collie%20portrait&image_size=square_hd',
  },
]

export default function FeaturedBreeding() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="heading-font text-2xl font-bold text-text-primary">精选配种</h2>
        <Link to="/breedings" className="flex items-center gap-1 text-primary text-sm font-medium hover:gap-2 transition-all">
          查看更多 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockBreedings.map((item) => (
          <Link
            key={item.id}
            to={`/breedings/${item.id}`}
            className="flex gap-4 bg-white rounded-2xl p-4 card-hover shadow-sm"
          >
            <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden">
              <img src={item.image} alt={item.breed} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary text-base">{item.breed}</h3>
              <p className="text-sm text-text-secondary mt-0.5">名字：{item.petName} · {item.age}</p>
              <div className="flex items-center gap-2 mt-2">
                {item.pedigree && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-full font-medium">
                    <Award className="w-3 h-3" />
                    有血统证
                  </span>
                )}
                {item.healthCert && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-success/10 text-success text-xs rounded-full font-medium">
                    健康证明
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
