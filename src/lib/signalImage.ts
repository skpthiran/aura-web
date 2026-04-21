export function getSignalImage(id: string, tags: string[] = [], type: string = 'moment'): string {
  const height = type === 'event' ? 600 : 800
  return `https://picsum.photos/seed/${id}/${800}/${height}`
}
