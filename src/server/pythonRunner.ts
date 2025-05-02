
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Runs the Python ARIMA analysis script with provided data
 */
export async function runPythonScript(data: any, column: string, config: any): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary file to store the input data
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `arima_input_${Date.now()}.json`);
      const outputFile = path.join(tempDir, `arima_output_${Date.now()}.json`);
      
      // Write the input data to the temp file
      fs.writeFileSync(tempFile, JSON.stringify({
        data: data,
        column: column,
        config: config
      }));

      // Determine the path to the Python script
      const scriptPath = path.resolve(process.cwd(), 'python_scripts', 'main.py');
      
      // Check if the Python script exists
      if (!fs.existsSync(scriptPath)) {
        reject(new Error(`Python script not found at: ${scriptPath}`));
        return;
      }

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
      });

      // Collect stderr
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
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
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Read the output file
          const outputData = JSON.stringify(fs.readFileSync(outputFile, 'utf8'));
          
          // Clean up the output temp file
          try {
            fs.unlinkSync(outputFile);
          } catch (e) {
            console.warn('Failed to delete temp output file:', e);
          }

          // Parse and return the results
          resolve(JSON.parse(outputData));
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error}`));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}
