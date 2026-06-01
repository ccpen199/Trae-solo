import { Heart, Clock, Calendar, Star } from 'lucide-react';
import type { Movie } from '../types';
import ScoreBadge from './ScoreBadge';
import { useAppStore } from '../stores/appStore';

interface MovieCardProps {
  movie: Movie;
  rank?: number;
  onSelect?: () => void;
}

export default function MovieCard({ movie, rank, onSelect }: MovieCardProps) {
  const { isFavorite, addFavorite, removeFavorite, setCurrentMovieId, setCurrentPage } = useAppStore();
  const isFav = isFavorite(movie.id);

  const handleClick = () => {
    setCurrentMovieId(movie.id);
    setCurrentPage('movie');
    onSelect?.();
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFav) {
      removeFavorite(movie.id);
    } else {
      addFavorite(movie.id);
    }
  };

  const getHeatColor = (score: number) => {
    if (score >= 9500) return 'bg-red-500';
    if (score >= 9000) return 'bg-orange-500';
    if (score >= 8500) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-cinema-bg-light rounded-xl overflow-hidden card-hover cursor-pointer animate-fade-in"
    >
      {rank !== undefined && rank <= 3 && (
        <div className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
          rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
          rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
          'bg-gradient-to-br from-amber-600 to-amber-800'
        } shadow-lg`}>
          {rank}
        </div>
      )}

      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-transparent to-transparent opacity-80" />
        
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
              isFav 
                ? 'bg-cinema-red text-white' 
                : 'bg-black/50 text-white hover:bg-cinema-red'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ScoreBadge score={movie.rating} size="sm" />
            <div className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getHeatColor(movie.heatScore)}`}>
              热度 {Math.round(movie.heatScore / 100)}
            </div>
          </div>
          <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-cinema-red transition-colors">
            {movie.title}
          </h3>
          {movie.originalTitle && (
            <p className="text-xs text-cinema-text-secondary line-clamp-1">
              {movie.originalTitle}
            </p>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {movie.genre.slice(0, 3).map((g) => (
            <span
              key={g}
              className="px-2 py-0.5 bg-cinema-bg rounded text-xs text-cinema-text-secondary"
            >
              {g}
            </span>
          ))}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-cinema-text-secondary">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{movie.duration}分钟</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{movie.releaseDate.slice(5)}</span>
          </div>
        </div>

        {movie.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {movie.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-cinema-red/10 text-cinema-red rounded text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="absolute inset-0 border-2 border-transparent group-hover:border-cinema-red/50 rounded-xl transition-colors pointer-events-none" />
    </div>
  );
}
