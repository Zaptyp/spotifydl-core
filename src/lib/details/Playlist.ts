import { IPlaylist } from '../../typings/index.js'

export default class Playlist implements IPlaylist {
    constructor(
        public name = '',
        public artists: string[] = [],
        public total_tracks = 0,
        public tracks: string[] = []
    ) {}
}
