// /api/uploadedFile.js

import { Blob } from '@vercel/blob';
import Busboy from 'busboy';
import { exec } from 'child_process';
import util from 'util';

export const config = {
  api: {
    bodyParser: false, // disable default body parsing to handle multipart data
  },
};

const execPromise = util.promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  try {
    // Parse the multipart/form-data request using Busboy
    const fileData = await new Promise((resolve, reject) => {
      const busboy = new Busboy({ headers: req.headers });
      let fileFound = false;
      let fileBuffer;
      let fileMime;
      busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        fileFound = true;
        const chunks = [];
        file.on('data', (data) => chunks.push(data));
        file.on('end', () => {
          fileBuffer = Buffer.concat(chunks);
          fileMime = mimetype;
        });
      });
      busboy.on('finish', () => {
        if (!fileFound) {
          return reject(new Error('No file uploaded'));
        }
        resolve({ buffer: fileBuffer, mimetype: fileMime });
      });
      busboy.on('error', reject);
      req.pipe(busboy);
    });

    console.log('Received file upload request');

    // Upload the file to Vercel Blob
    const blob = new Blob();
    const { url } = await blob.upload(fileData.buffer, {
      contentType: fileData.mimetype,
      filename: 'inputAudio.mp3',
    });
    console.log('File uploaded to Vercel Blob:', url);

    // Run audio_parser.py to generate the transcription.
    // Note: the relative path to the Python script may need adjustment in Vercel.
    const { stdout: audioParserOut, stderr: audioParserErr } = await execPromise(`python ../backend/audio_parser.py ${url}`);
    if (audioParserErr) {
      console.error(`audio_parser.py stderr: ${audioParserErr}`);
    }
    console.log(`audio_parser.py stdout: ${audioParserOut}`);

    // Run agent.py to process the transcription.
    const { stdout: agentOut, stderr: agentErr } = await execPromise('python ../backend/agent.py');
    if (agentErr) {
      console.error(`agent.py stderr: ${agentErr}`);
    }
    console.log(`agent.py stdout: ${agentOut}`);

    res.status(200).send('Audio file processed successfully.');
  } catch (error) {
    console.error('Error processing file upload:', error);
    res.status(500).send('Error processing audio file.');
  }
}
