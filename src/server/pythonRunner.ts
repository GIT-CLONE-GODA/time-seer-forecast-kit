
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
      
      console.log(`Creating temp input file: ${tempFile}`);
      console.log(`Output will be written to: ${outputFile}`);
      
      // Write the input data to the temp file
      const inputData = {
        data: data,
        column: column,
        config: config
      };
      
      fs.writeFileSync(tempFile, JSON.stringify(inputData));
      console.log(`Input data written to temp file (${fs.statSync(tempFile).size} bytes)`);

      // Determine the path to the Python script
      const scriptPath = path.resolve(process.cwd(), 'python_scripts', 'main.py');
      
      // Check if the Python script exists
      if (!fs.existsSync(scriptPath)) {
        console.error(`Python script not found at: ${scriptPath}`);
        reject(new Error(`Python script not found at: ${scriptPath}`));
        return;
      }
      
      console.log(`Running Python script: ${scriptPath}`);

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
        const output = data.toString();
        stdout += output;
        console.log(`Python stdout: ${output}`);
      });

      // Collect stderr
      pythonProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.error(`Python stderr: ${output}`);
      });

      // Handle process completion
      pythonProcess.on('close', (code) => {
        // Clean up the input temp file
        try {
          fs.unlinkSync(tempFile);
          console.log(`Deleted temp input file: ${tempFile}`);
        } catch (e) {
          console.warn('Failed to delete temp input file:', e);
        }

        if (code !== 0) {
          console.error(`Python process exited with code ${code}: ${stderr}`);
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Check if output file exists
          if (!fs.existsSync(outputFile)) {
            reject(new Error(`Output file was not created: ${outputFile}`));
            return;
          }
          
          console.log(`Reading output file: ${outputFile} (${fs.statSync(outputFile).size} bytes)`);
          
          // Read the output file
          const outputData = fs.readFileSync(outputFile, 'utf8');
          
          // Clean up the output temp file
          try {
            fs.unlinkSync(outputFile);
            console.log(`Deleted temp output file: ${outputFile}`);
          } catch (e) {
            console.warn('Failed to delete temp output file:', e);
          }

          try {
            // Parse and return the results
            const parsedData = JSON.parse(outputData);
            console.log("Successfully parsed Python output");
            resolve(parsedData);
          } catch (parseError) {
            console.error('Failed to parse output JSON:', parseError);
            console.error('Raw output:', outputData);
            reject(new Error(`Failed to parse Python output: ${parseError.message}`));
          }
        } catch (error) {
          console.error('Error handling Python output:', error);
          reject(error);
        }
      });
      
      // Handle process errors
      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    } catch (error) {
      console.error('Unexpected error in runPythonScript:', error);
      reject(error);
    }
  });
}
