const BASE_URL = 'https://api.themoviedb.org/3';
export const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
export const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';

const get = async (endpoint, params = {}) => {
  const query = new URLSearchParams({ api_key: API_KEY, ...params }).toString();
  const res = await fetch(`${BASE_URL}${endpoint}?${query}`);
  const data = await res.json();
  return data;
};

// Movies
export const getTrendingMovies = () => get('/trending/movie/week');
export const getPopularMovies = () => get('/movie/popular');
export const getTopRatedMovies = () => get('/movie/top_rated');
export const getMovieDetails = (id) => get(`/movie/${id}`, { append_to_response: 'videos,credits' });

// TV Series
export const getPopularSeries = () => get('/tv/popular');
export const getTopRatedSeries = () => get('/tv/top_rated');
export const getSeriesDetails = (id) => get(`/tv/${id}`, { append_to_response: 'videos,credits' });

// Search
export const searchMulti = (query) => get('/search/multi', { query });