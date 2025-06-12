import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import node7z from 'node-7z';
import { path7za } from '7zip-bin';
import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';

const { extractFull } = node7z;

export async function getMatchDetailsById(req, res) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const matchTPId = req.params.matchTPId;
    const archivePath = join(__dirname, `../data/matchDetails/${matchTPId}.json.7z`);
    const extractDir = join(__dirname, `../data/matchDetails/tmp/${matchTPId}`);
    const jsonPath = join(extractDir, `${matchTPId}.json`);

    try {
        // Ako lokalno NE postoji, pokušaj skinuti s GitHub-a
        if (!existsSync(archivePath)) {
            const githubRawUrl = `https://raw.githubusercontent.com/StankoH/tennis-oracle/main/backend/data/matchDetails/${matchTPId}.json.7z`;

            try {
                const response = await axios.get(githubRawUrl, { responseType: 'arraybuffer' });
                writeFileSync(archivePath, response.data);
                console.log(`Preuzet ${matchTPId}.json.7z s GitHub-a.`);
            } catch (downloadErr) {
                return res.status(404).json({ error: 'Match archive not found (local nor GitHub).' });
            }
        }

        // Kreiraj tmp folder
        mkdirSync(extractDir, { recursive: true });

        // Ekstrakcija
        await new Promise((resolve, reject) => {
            const extraction = extractFull(archivePath, extractDir, { $bin: path7za });
            extraction.on('end', resolve);
            extraction.on('error', reject);
        });

        const raw = readFileSync(jsonPath, 'utf-8');
        const data = JSON.parse(raw);

        // Čišćenje
        rmSync(extractDir, { recursive: true, force: true });

        res.json(data);
    } catch (err) {
        console.error('Extraction failed:', err);
        res.status(500).json({ error: 'Failed to extract match details.' });
    }
}
