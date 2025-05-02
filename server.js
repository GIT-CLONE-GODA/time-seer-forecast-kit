
const express = require('express');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve the Vite app in production (in development, Vite has its own server)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
}

// API endpoint to run the ARIMA model
app.post('/api/run-arima', async (req, res) => {
  try {
    const { data, column, config } = req.body;
    
    // Create a temporary file to store the input data
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `arima_input_${Date.now()}.json`);
    const outputFile = path.join(tempDir, `arima_output_${Date.now()}.json`);
    
    // Write the input data to the temp file
    fs.writeFileSync(tempFile, JSON.stringify({
      data,
      column,
      config
    }));

    // Determine the path to the Python script
    const scriptPath = path.resolve(__dirname, 'python_scripts', 'main.py');
    
    console.log(`Running Python script: ${scriptPath}`);
    console.log(`Input file: ${tempFile}`);
    console.log(`Output file: ${outputFile}`);
    
    // Spawn the Python process
    const pythonProcess = spawn('python', [
      scriptPath,
      '--input', tempFile,
      '--output', outputFile,
      '--mode', 'api'
    ]);

    let stdout = '';
    let stderr = '';

    // Collect stdout
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`Python stdout: ${data}`);
    });

    // Collect stderr
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`Python stderr: ${data}`);
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      // Clean up the input temp file
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        console.warn('Failed to delete temp input file:', e);
      }

      if (code !== 0) {
        console.error(`Python process exited with code ${code}: ${stderr}`);
        return res.status(500).json({ 
          error: `Python process exited with code ${code}`,
          details: stderr 
        });
      }

      try {
        // Read the output file
        const outputData = fs.readFileSync(outputFile, 'utf8');
        
        // Clean up the output temp file
        try {
          fs.unlinkSync(outputFile);
        } catch (e) {
          console.warn('Failed to delete temp output file:', e);
        }

        // Parse and return the results
        const results = JSON.parse(outputData);
        res.json(results);
      } catch (error) {
        console.error('Failed to parse Python output:', error);
        res.status(500).json({ 
          error: 'Failed to parse Python output',
          details: error.message 
        });
      }
    });

    // Handle process errors
    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      res.status(500).json({ 
        error: 'Failed to start Python process',
        details: error.message 
      });
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
});

// For any other route in production, serve the index.html
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
