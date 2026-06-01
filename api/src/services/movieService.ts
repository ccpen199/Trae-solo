import { db } from '../config/database.js';
import type { Movie, ScoreSource, HeatTrend, Seat, SeatRecommendation } from '../types/index.js';

const SOURCE_WEIGHTS: Record<string, number> = {
  douban: 0.30,
  imdb: 0.25,
  rottentomatoes: 0.20,
  maoyan: 0.15,
  taopiaopiao: 0.10
};

function normalizeScore(score: number, source: string): number {
  if (source === 'rottentomatoes') {
    return score / 10;
  }
  return score;
}

function calculateVoteWeight(voteCount: number, maxVotes: number): number {
  const ratio = voteCount / maxVotes;
  return 0.5 + 0.5 * (1 - Math.exp(-ratio * 2));
}

export function fuseMovieScores(movieId: string): { fused_score: number; sources: ScoreSource[] } {
  const stmt = db.prepare(`
    SELECT source, score, vote_count 
    FROM scores 
    WHERE movie_id = ? 
    ORDER BY recorded_at DESC
  `);
  const scores = stmt.all(movieId) as ScoreSource[];
  
  if (scores.length === 0) {
    return { fused_score: 0, sources: [] };
  }
  
  const maxVotes = Math.max(...scores.map(s => s.vote_count));
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  const normalizedSources = scores.map(score => {
    const normalizedScore = normalizeScore(score.score, score.source);
    const baseWeight = SOURCE_WEIGHTS[score.source] || 0.1;
    const voteWeight = calculateVoteWeight(score.vote_count, maxVotes);
    const finalWeight = baseWeight * voteWeight;
    
    weightedSum += normalizedScore * finalWeight;
    totalWeight += finalWeight;
    
    return {
      ...score,
      score: normalizedScore
    };
  });
  
  const fusedScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
  
  return {
    fused_score: fusedScore,
    sources: normalizedSources
  };
}

export function getHeatTrend(movieId: string): HeatTrend[] {
  const stmt = db.prepare(`
    SELECT id, movie_id, trend_date, value
    FROM heat_trends
    WHERE movie_id = ?
    ORDER BY trend_date ASC
  `);
  return stmt.all(movieId) as HeatTrend[];
}

export function calculateCurrentHeat(movieId: string): number {
  const trends = getHeatTrend(movieId);
  if (trends.length === 0) return 50;
  
  const recentTrends = trends.slice(-3);
  const weights = [0.2, 0.3, 0.5];
  
  let heat = 0;
  recentTrends.forEach((trend, index) => {
    heat += trend.value * weights[index];
  });
  
  return Math.round(heat * 10) / 10;
}

export function getMovieWithDetails(movieId: string): (Movie & { 
  fused_score: number; 
  scores: ScoreSource[]; 
  heat_trends: HeatTrend[];
  current_heat: number;
}) | null {
  const movieStmt = db.prepare(`
    SELECT id, title, poster, description, duration, release_date, genre, created_at
    FROM movies
    WHERE id = ?
  `);
  const movie = movieStmt.get(movieId) as Movie;
  
  if (!movie) return null;
  
  const { fused_score, sources } = fuseMovieScores(movieId);
  const heat_trends = getHeatTrend(movieId);
  const current_heat = calculateCurrentHeat(movieId);
  
  return {
    ...movie,
    fused_score,
    scores: sources,
    heat_trends,
    current_heat
  };
}

export function getAllMoviesWithScores(): Array<Movie & { 
  fused_score: number; 
  current_heat: number;
}> {
  const moviesStmt = db.prepare(`
    SELECT id, title, poster, description, duration, release_date, genre, created_at
    FROM movies
    ORDER BY release_date DESC
  `);
  const movies = moviesStmt.all() as Movie[];
  
  return movies.map(movie => {
    const { fused_score } = fuseMovieScores(movie.id);
    const current_heat = calculateCurrentHeat(movie.id);
    return {
      ...movie,
      fused_score,
      current_heat
    };
  });
}

function calculateSeatScore(seat: Seat, centerRow: number, centerCol: number): number {
  const rowDist = Math.abs(seat.row_num - centerRow) / centerRow;
  const colDist = Math.abs(seat.col_num - centerCol) / centerCol;
  
  const viewScore = 1 - (rowDist + colDist) / 2;
  const angleScore = seat.view_angle / 90;
  
  let typeBonus = 0;
  if (seat.seat_type === 'vip') typeBonus = 0.15;
  else if (seat.seat_type === 'couple') typeBonus = 0.05;
  else if (seat.seat_type === 'accessible') typeBonus = -0.1;
  
  const pricePenalty = (seat.price - 35) / 100;
  
  return Math.max(0, Math.min(1, viewScore * 0.4 + angleScore * 0.4 + typeBonus - pricePenalty * 0.2));
}

export function recommendConsecutiveSeats(
  sessionId: string, 
  seatCount: number, 
  preferredType?: string
): SeatRecommendation[] {
  const seatsStmt = db.prepare(`
    SELECT id, session_id, row_num, col_num, status, seat_type, view_angle, price
    FROM seats
    WHERE session_id = ? AND status = 'available'
    ORDER BY row_num, col_num
  `);
  const allSeats = seatsStmt.all(sessionId) as Seat[];
  
  if (allSeats.length === 0) return [];
  
  const maxRow = Math.max(...allSeats.map(s => s.row_num));
  const maxCol = Math.max(...allSeats.map(s => s.col_num));
  const centerRow = maxRow / 2;
  const centerCol = maxCol / 2;
  
  const seatMap = new Map<string, Seat>();
  for (const seat of allSeats) {
    seatMap.set(`${seat.row_num}-${seat.col_num}`, seat);
  }
  
  const recommendations: SeatRecommendation[] = [];
  
  for (let row = 1; row <= maxRow; row++) {
    for (let col = 1; col <= maxCol - seatCount + 1; col++) {
      const group: Seat[] = [];
      let valid = true;
      
      for (let i = 0; i < seatCount; i++) {
        const seat = seatMap.get(`${row}-${col + i}`);
        if (!seat || seat.status !== 'available') {
          valid = false;
          break;
        }
        if (preferredType && seat.seat_type !== preferredType) {
          valid = false;
          break;
        }
        group.push(seat);
      }
      
      if (valid && group.length === seatCount) {
        const avgScore = group.reduce((sum, s) => sum + calculateSeatScore(s, centerRow, centerCol), 0) / seatCount;
        const centerDist = Math.abs(row - centerRow) + Math.abs(col + seatCount / 2 - centerCol);
        const avgView = group.reduce((sum, s) => sum + s.view_angle, 0) / seatCount;
        
        recommendations.push({
          seats: group,
          score: Math.round(avgScore * 100) / 100,
          center_distance: Math.round(centerDist * 10) / 10,
          view_score: Math.round(avgView * 10) / 10
        });
      }
    }
  }
  
  recommendations.sort((a, b) => b.score - a.score);
  
  return recommendations.slice(0, 5);
}

export function getCastMembers(movieId: string) {
  const stmt = db.prepare(`
    SELECT id, movie_id, name, role, avatar, influence_weight
    FROM cast_members
    WHERE movie_id = ?
    ORDER BY influence_weight DESC
  `);
  return stmt.all(movieId);
}
