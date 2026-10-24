export const extractYTId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*)/);
  return (match && match[1].length === 11) ? match[1] : null;
};

export const extractPlaylistId = (url: string) => {
  const match = url.match(/[?&]list=([^#&?]+)/);
  return match ? match[1] : null;
};
