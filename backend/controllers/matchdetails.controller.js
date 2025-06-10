import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'fs';
import node7z from 'node-7z';
import { path7za } from '7zip-bin'; // ← OVO SI ZABORAVIO
import { fileURLToPath } from 'url';
import path from 'path';

const { extractFull } = node7z;


export async function getMatchDetailsById(req, res) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const matchTPId = req.params.matchTPId;
    const archivePath = join(__dirname, `../data/matchDetails/${matchTPId}.json.7z`);
    const extractDir = join(__dirname, `../data/matchDetails/tmp/${matchTPId}`);
    const jsonPath = join(extractDir, `${matchTPId}.json`);

    try {
        if (!existsSync(archivePath)) {
            return res.status(404).json({ error: 'Match archive not found.' });
        }

        // Kreiraj tmp folder ako ne postoji
        mkdirSync(extractDir, { recursive: true });

        // Ekstrakcija
        await new Promise((resolve, reject) => {
            const extraction = extractFull(archivePath, extractDir, {
                $bin: path7za,
            });

            extraction.on('end', resolve);
            extraction.on('error', reject);
        });

        // Parsiraj JSON
        const raw = readFileSync(jsonPath, 'utf-8');
        const data = JSON.parse(raw);

        // Opcionalno brisanje (cleanup)
        rmSync(extractDir, { recursive: true, force: true });

        res.json(data);
    } catch (err) {
        console.error('Extraction failed:', err);
        res.status(500).json({ error: 'Failed to extract match details.' });
    }
}