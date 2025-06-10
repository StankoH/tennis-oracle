import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import util from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = util.promisify(exec);
const TRUESKILL_DIR = path.join(__dirname, "..", "data", "trueskill");

export const extractTrueSkill = async (playerTPId, beforeDate = null) => {
    const archivePath = path.join(TRUESKILL_DIR, `player-${playerTPId}.json.7z`);
    const jsonPath = path.join(TRUESKILL_DIR, `player-${playerTPId}.json`);

    if (!fs.existsSync(archivePath)) {
        console.warn(`⚠️ Arhiva ne postoji za playerTPId: ${playerTPId}`);
        return [];
    }

    const sevenZipPath = `"C:\\Program Files\\7-Zip\\7z.exe"`;

    try {
        await execAsync(`${sevenZipPath} e "${archivePath}" -o"${TRUESKILL_DIR}" -y`);
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const data = JSON.parse(raw);

        return beforeDate
            ? data.filter((entry) => new Date(entry.dateTime) < new Date(beforeDate))
            : data;
    } catch (err) {
        console.error(`❌ Greška pri dekompresiji za player ${playerTPId}:`, err.message);
        return [];
    } finally {
        if (fs.existsSync(jsonPath)) {
            fs.unlink(jsonPath, () => { });
        }
    }
};

export const getTrueSkillHistory = async (req, res) => {
    try {
        const { playerTPId, player1TPId, player2TPId, beforeDate } = req.query;

        if (playerTPId) {
            const history = await extractTrueSkill(playerTPId, beforeDate);
            return res.json({ playerTPId, history });
        }

        if (player1TPId && player2TPId) {
            const [p1, p2] = await Promise.all([
                extractTrueSkill(player1TPId, beforeDate),
                extractTrueSkill(player2TPId, beforeDate),
            ]);
            return res.json({
                player1TPId,
                player2TPId,
                player1History: p1,
                player2History: p2,
            });
        }

        return res.status(400).json({ message: "⚠️ Nedostaje playerTPId ili kombinacija player1TPId + player2TPId." });
    } catch (err) {
        console.error("❌ Backend greška:", err.message);
        return res.status(500).json({ message: "❌ Server error" });
    }
};