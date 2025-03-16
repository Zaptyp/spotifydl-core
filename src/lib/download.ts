import os from 'os'
import ytdl from '@distube/ytdl-core'
import SpotifyDlError from './Error'
import { readFile, unlink, writeFile } from 'fs-extra'
import axios from 'axios'
import Ffmpeg from 'fluent-ffmpeg'
import YTDlpWrap from 'yt-dlp-wrap';
import { PassThrough, Readable, Writable } from 'stream';

/**
 * Function to download the give `YTURL`
 * @param {string} url The youtube URL to download
 * @returns `Buffer`
 * @throws Error if the URL is invalid
 */
export const downloadYT = async (url: string, forceYtdlp = false): Promise<Buffer> => {
    if (!ytdl.validateURL(url)) throw new SpotifyDlError('Invalid YT URL', 'SpotifyDlError');
    
    const filename = `${Math.random().toString(36).slice(-5)}.mp3`;
    let stream: Readable = new PassThrough();

    if (!forceYtdlp) {
        try {
            // Próba z ytdl-core
            console.log('Using ytdl-core for download');
            stream = ytdl(url, { quality: 'highestaudio', filter: 'audioonly' });
        } catch (err) {
            console.error('ytdl-core error, switching to yt-dlp:', err);
            forceYtdlp = true;
        }
    }

    if (forceYtdlp) {
        console.log('Forcing yt-dlp download');
        const ytdlp = new YTDlpWrap();
        stream = ytdlp.execStream([url, '-f', 'ba', '-x']);
    }
    console.log(forceYtdlp)
    return new Promise((resolve, reject) => {
        Ffmpeg(stream)
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
    try {
        // Pierwsza próba z ytdl-core
        const audio = await downloadYT(url);
        await writeFile(`${os.tmpdir()}/${filename}`, audio);
        return `${os.tmpdir()}/${filename}`;
    } catch (firstError) {
        console.error('First download failed, retrying with yt-dlp:', firstError);
        
        // Druga próba z wymuszeniem yt-dlp
        try {
            const audio = await downloadYT(url, true);
            await writeFile(`${os.tmpdir()}/${filename}`, audio);
            return `${os.tmpdir()}/${filename}`;
        } catch (secondError) {
            throw new SpotifyDlError(`Both download attempts failed: ${secondError}`, 'DownloadError');
        }
    }
};
/**
 * Function to get buffer of files with their URLs
 * @param url URL to get Buffer of
 * @returns Buffer
 */
export const getBufferFromUrl = async (url: string): Promise<Buffer> =>
    (await axios.get(url, { responseType: 'arraybuffer' })).data
