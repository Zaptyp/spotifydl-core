import yts from 'yt-search'
import YTMusic, { SongDetailed } from 'ytmusic-api'
import SpotifyDlError from "./Error"

export async function getYtLink(term: string): Promise<string> {
    const { videos } = await yts.search(term)
    if (videos && videos.length > 0) {
        const video = videos.filter((video) => video.seconds < 3600)[0]
        //console.log(video)
        if (video) return video.url
    }
    return ''
}

export async function getYtMusicLink(term: string): Promise<string> {
    if (!term) throw new SpotifyDlError('No search term provided')
    const ytmusic = new YTMusic()
    await ytmusic.initialize()
    const searchResults = await ytmusic.searchSongs(term)
    if (searchResults && searchResults.length > 0) {
        const songs = searchResults.filter((result): result is SongDetailed => result.type === 'SONG')
        if (songs.length > 0) {
            const song2 = songs[0]
            if (song2.type === 'SONG') {
                return `https://www.youtube.com/watch?v=${song2.videoId}`
            }
            if (song2.type === 'VIDEO') {
                return `https://www.youtube.com/watch?v=${song2.videoId}`
            }
        }
    }
    //throw new SpotifyDlError(`No results found? Very rare error! Searched term: ${term}`)
    console.error(`getYTMusicLink: No results found? Very rare error! Searched term: ${term}`)
    return ''
}