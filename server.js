const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // Import the cors package
const { exec } = require('child_process'); // Import child_process

const app = express();
const port = 3001;

app.use(cors({
  origin: 'http://localhost:3000/' // Replace with your client's URL
}));

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../backend/AnyUploadedFile');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, 'inputAudio.mp3'); // Rename the file to inputAudio.mp3
  },
});

const upload = multer({ storage });

// Serve the uploads directory as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/getToDo', (req, res) => {
  const outputFilePath = path.join(__dirname, 'task-organizer/public/output.json');
  
  console.log(`Fetching data from: ${outputFilePath}`);
  
  fs.readFile(outputFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading output.json: ${err.message}`);
      return res.status(500).send('Error reading output.json.');
    }
    
    console.log('Data fetched successfully:', data);
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); // Manually set the CORS header
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  });
});

app.post('/uploadedFile', upload.single('audio'), (req, res) => {
  console.log('Received file upload request');
  if (!req.file) {
    console.error('No file uploaded');
    return res.status(400).send('No file uploaded.');
  }

  const inputAudioPath = path.join(__dirname, '../backend/AnyUploadedFile/inputAudio.mp3');

  // Run audio_parser.py to generate the transcription
  exec(`python ../backend/audio_parser.py ${inputAudioPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running audio_parser.py: ${error.message}`);
      return res.status(500).send('Error processing audio file.');
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    console.log(`stdout: ${stdout}`);

    // Run agent.py to process the transcription
    exec('python ../backend/agent.py', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running agent.py: ${error.message}`);
        return res.status(500).send('Error processing transcription.');
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);

      // Send a simple success response
      res.status(200).send('Audio file processed successfully.');
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});