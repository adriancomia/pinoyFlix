const BASE_URL = 'https://api.jikan.moe/v4';

const get = async (endpoint) => {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  const data = await res.json();
  return data;
};

export const getTopAnime = () => get('/top/anime?filter=airing');
export const getPopularAnime = () => get('/top/anime?filter=bypopularity');
export const getAnimeDetails = (id) => get(`/anime/${id}/full`);
export const getAnimeEpisodes = (id) => get(`/anime/${id}/episodes`);
export const searchAnime = (query) => get(`/anime?q=${encodeURIComponent(query)}&limit=10`);