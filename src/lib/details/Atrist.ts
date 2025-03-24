import { IArtist } from '../../typings/index.js'

export default class Artist implements IArtist {
    constructor(
        public id = '',
        public name = '',
        public herf = ''
    ) {}
}
