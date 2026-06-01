import { db } from '../config/database.js';
import type { RecommendResult, Movie, User } from '../types/index.js';
import { fuseMovieScores, calculateCurrentHeat } from './movieService.js';

const OBJECTIVE_WEIGHTS = {
  score: 0.35,
  heat: 0.25,
  personalization: 0.25,
  diversity: 0.10,
  freshness: 0.05
};

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  const normProduct = Math.sqrt(norm1) * Math.sqrt(norm2);
  return normProduct === 0 ? 0 : dotProduct / normProduct;
}

function parseGenreVector(genre: string, allGenres: string[]): number[] {
  const movieGenres = genre.split(/[\/,]/).map(g => g.trim());
  return allGenres.map(g => movieGenres.includes(g) ? 1 : 0);
}

export function getMultiObjectiveRecommendations(
  userId: string, 
  limit: number = 10
): RecommendResult[] {
  const userStmt = db.prepare(`
    SELECT id, is_vip, view_history_vector, content_quality_score
    FROM users WHERE id = ?
  `);
  const user = userStmt.get(userId) as User;
  
  const moviesStmt = db.prepare(`
    SELECT id, title, genre, release_date, created_at
    FROM movies
    ORDER BY release_date DESC
  `);
  const movies = moviesStmt.all() as Array<Movie & { genre: string; release_date: string }>;
  
  const allGenres = Array.from(new Set(
    movies.flatMap(m => m.genre.split(/[\/,]/).map(g => g.trim()))
  ));
  
  const userVector = user?.view_history_vector 
    ? JSON.parse(user.view_history_vector) 
    : movies.map(() => 1 / movies.length);
  
  const movieData = movies.map((movie, index) => {
    const { fused_score } = fuseMovieScores(movie.id);
    const heat = calculateCurrentHeat(movie.id);
    
    const genreVector = parseGenreVector(movie.genre, allGenres);
    const userGenrePref = userVector.map(v => v || 0.5);
    const personalization = cosineSimilarity(genreVector, userGenrePref);
    
    const releaseDate = new Date(movie.release_date);
    const now = new Date();
    const daysSinceRelease = Math.floor((now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));
    const freshness = Math.max(0, 1 - daysSinceRelease / 90);
    
    return {
      movie,
      index,
      fused_score,
      heat,
      personalization,
      freshness,
      genre: movie.genre
    };
  });
  
  const scores = movieData.map(m => m.fused_score);
  const heats = movieData.map(m => m.heat);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const minHeat = Math.min(...heats);
  const maxHeat = Math.max(...heats);
  
  const selectedGenres = new Set<string>();
  
  const results = movieData.map(movieInfo => {
    const normScore = normalize(movieInfo.fused_score, minScore, maxScore);
    const normHeat = normalize(movieInfo.heat, minHeat, maxHeat);
    
    let diversityBonus = 0;
    const movieGenres = movieInfo.genre.split(/[\/,]/).map(g => g.trim());
    const newGenres = movieGenres.filter(g => !selectedGenres.has(g));
    if (newGenres.length > 0) {
      diversityBonus = 0.1 * (newGenres.length / movieGenres.length);
    }
    
    const rankScore = 
      normScore * OBJECTIVE_WEIGHTS.score +
      normHeat * OBJECTIVE_WEIGHTS.heat +
      movieInfo.personalization * OBJECTIVE_WEIGHTS.personalization +
      (movieInfo.freshness + diversityBonus) * OBJECTIVE_WEIGHTS.diversity +
      movieInfo.freshness * OBJECTIVE_WEIGHTS.freshness;
    
    const reasons: string[] = [];
    
    if (movieInfo.fused_score >= 8.0) {
      reasons.push(`评分高达 ${movieInfo.fused_score.toFixed(1)} 分`);
    }
    if (movieInfo.heat >= 75) {
      reasons.push('近期热度飙升');
    }
    if (movieInfo.personalization > 0.6) {
      reasons.push('符合您的观影偏好');
    }
    if (movieInfo.freshness > 0.7) {
      reasons.push('新上映影片');
    }
    
    return {
      movie_id: movieInfo.movie.id,
      rank_score: Math.round(rankScore * 1000) / 1000,
      reasons
    };
  });
  
  results.sort((a, b) => b.rank_score - a.rank_score);
  
  return results.slice(0, limit);
}

export function getHotMovies(limit: number = 10): RecommendResult[] {
  const moviesStmt = db.prepare(`
    SELECT m.id, m.title, m.release_date
    FROM movies m
    ORDER BY m.release_date DESC
    LIMIT ?
  `);
  const movies = moviesStmt.all(limit * 2) as Movie[];
  
  const results = movies.map(movie => {
    const { fused_score } = fuseMovieScores(movie.id);
    const heat = calculateCurrentHeat(movie.id);
    
    const rankScore = heat * 0.7 + fused_score * 3;
    
    const reasons: string[] = [];
    if (heat >= 80) reasons.push('全网热议');
    if (fused_score >= 8.5) reasons.push('口碑佳作');
    
    return {
      movie_id: movie.id,
      rank_score: Math.round(rankScore * 10) / 10,
      reasons
    };
  });
  
  results.sort((a, b) => b.rank_score - a.rank_score);
  
  return results.slice(0, limit);
}

export function getSimilarMovies(movieId: string, limit: number = 6): RecommendResult[] {
  const targetMovieStmt = db.prepare(`
    SELECT id, genre
    FROM movies WHERE id = ?
  `);
  const targetMovie = targetMovieStmt.get(movieId) as { id: string; genre: string };
  
  if (!targetMovie) return [];
  
  const moviesStmt = db.prepare(`
    SELECT id, title, genre, release_date
    FROM movies WHERE id != ?
  `);
  const movies = moviesStmt.all(movieId) as Array<{ id: string; title: string; genre: string; release_date: string }>;
  
  const allGenres = Array.from(new Set(
    [...movies, targetMovie].flatMap(m => m.genre.split(/[\/,]/).map(g => g.trim()))
  ));
  
  const targetVector = parseGenreVector(targetMovie.genre, allGenres);
  
  const results = movies.map(movie => {
    const movieVector = parseGenreVector(movie.genre, allGenres);
    const similarity = cosineSimilarity(targetVector, movieVector);
    const { fused_score } = fuseMovieScores(movie.id);
    
    const rankScore = similarity * 0.7 + normalize(fused_score, 5, 10) * 0.3;
    
    const reasons: string[] = [];
    if (similarity > 0.7) reasons.push('题材相似');
    if (fused_score >= 8.0) reasons.push('高评分');
    
    return {
      movie_id: movie.id,
      rank_score: Math.round(rankScore * 1000) / 1000,
      reasons
    };
  });
  
  results.sort((a, b) => b.rank_score - a.rank_score);
  
  return results.slice(0, limit);
}

export function getPersonalizedFeed(
  userId: string, 
  page: number = 1, 
  pageSize: number = 10
): { items: RecommendResult[]; total: number } {
  const allRecommendations = getMultiObjectiveRecommendations(userId, page * pageSize);
  const startIndex = (page - 1) * pageSize;
  
  return {
    items: allRecommendations.slice(startIndex, startIndex + pageSize),
    total: allRecommendations.length
  };
}
