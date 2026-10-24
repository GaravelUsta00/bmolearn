// YouTube kimlikleri yalnızca [A-Za-z0-9_-] içerir; başka karakter içeren değer reddedilir.
const VIDEO_ID = /^[\w-]{11}$/;
const PLAYLIST_ID = /^[\w-]{2,64}$/;

export const extractYTId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?/]*)/);
  return match && VIDEO_ID.test(match[1]) ? match[1] : null;
};

export const extractPlaylistId = (url: string) => {
  const match = url.match(/[?&]list=([^#&?]+)/);
  return match && PLAYLIST_ID.test(match[1]) ? match[1] : null;
};
