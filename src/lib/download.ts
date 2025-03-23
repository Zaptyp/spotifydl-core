import os from 'os'
import SpotifyDlError from './Error'
import { readFile, unlink, writeFile } from 'fs-extra'
import axios from 'axios'
import Ffmpeg from 'fluent-ffmpeg'
import YTDlpWrap from 'yt-dlp-wrap';
import { PassThrough, Readable } from 'stream';
import colors from 'colors'

/**
 * Function to download the give `YTURL`
 * @param {string} url The youtube URL to download
 * @returns `Buffer`
 * @throws Error if the URL is invalid
 */
export const downloadYT = async (url: string): Promise<Buffer> => {
    const ytdlp = new YTDlpWrap();
    let version: string;
    if (!ytdlp.validateURL(url)) throw new SpotifyDlError('Invalid YT URL', 'SpotifyDlError');
    try {
        version = await ytdlp.getVersion();
    } catch (err) {
        throw new SpotifyDlError('YT-DLP not installed!', 'SpotifyDlError');
    }
    let githubYTDLPVersion = await YTDlpWrap.getGithubReleases(1, 3)
    if (!githubYTDLPVersion[0].tag_name.includes(version.trim() || !githubYTDLPVersion[1].tag_name.includes(version.trim()))) {
        console.error(colors.yellow('YT-DLP is outdated, update to latest version! Because if you don\'t, you might face issues with downloading songs from YouTube!'));
        console.error(colors.yellow('Latest version: ' + githubYTDLPVersion[0].tag_name));
        console.error(colors.yellow('Current version (installed on your system): ' + version));
    }
    const filename = `${Math.random().toString(36).slice(-5)}.mp3`;
    let streamYT: Readable = new PassThrough();

    streamYT = ytdlp.execStream([url, '-f', 'ba', '-x']);
    return new Promise((resolve, reject) => {
        Ffmpeg(streamYT)
            .audioBitrate(128)
            .save(`${os.tmpdir()}/${filename}`)
            .on('error', reject)
            .on('end', async () => {
                try {
                    const buffer = await readFile(`${os.tmpdir()}/${filename}`);
                    await unlink(`${os.tmpdir()}/${filename}`);
                    resolve(buffer);
                } catch (err) {
                    reject(new SpotifyDlError('File processing failed', 'FileError'));
                }
            });
    });
};

/**
 * Function to download and save audio from youtube
 * @param url URL to download
 * @param filename the file to save to
 * @returns filename
 */
export const downloadYTAndSave = async (
    url: string,
    filename = `${Math.random().toString(36).slice(-5)}.mp3`
): Promise<string> => {
    const audio = await downloadYT(url);
    await writeFile(`${os.tmpdir()}/${filename}`, audio);
    return `${os.tmpdir()}/${filename}`;
};
/**
 * Function to get buffer of files with their URLs
 * @param url URL to get Buffer of
 * @returns Buffer
 */
export const getBufferFromUrl = async (url: string): Promise<Buffer> =>
    (await axios.get(url, { responseType: 'arraybuffer' })).data
