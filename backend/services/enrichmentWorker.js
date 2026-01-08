import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function startWorker() {
    const scriptPath = path.resolve(__dirname, '../../backend-python/enrichment_worker.py');
    // console.log(`[EnrichmentManager] Spawning Python Worker: ${scriptPath}`);

    const pythonProcess = spawn('python', [scriptPath], {
        cwd: path.dirname(scriptPath), // execute in the python dir so .env loads correctly
        stdio: ['ignore', 'pipe', 'pipe']
    });

    pythonProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        lines.forEach(line => console.log(`[Python] ${line}`));
    });

    pythonProcess.stderr.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        lines.forEach(line => console.error(`[Python] ${line}`));
    });

    pythonProcess.on('close', (code) => {
        console.log(`[EnrichmentManager] Python worker exited with code ${code}`);
        // Optional: Restart logic could go here
    });

    return pythonProcess;
}

export { startWorker };
