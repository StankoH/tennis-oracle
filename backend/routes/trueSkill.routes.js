import express from "express";
import { extractTrueSkill } from "../controllers/trueSkill.controller.js";
import { mergeAndNormalizeTrueSkillHistory } from "../helper/mergeTrueSkillNormalized.js";

const router = express.Router();

// GET /trueskill/history/merged?player1TPId=...&player2TPId=...
router.get("/history/merged", async (req, res) => {
  const { player1TPId, player2TPId } = req.query;

  if (!player1TPId || !player2TPId) {
    return res.status(400).json({ message: "❗ player1TPId i player2TPId su obavezni" });
  }

  try {
    const [history1, history2] = await Promise.all([
      extractTrueSkill(player1TPId),
      extractTrueSkill(player2TPId)
    ]);

    const merged = mergeAndNormalizeTrueSkillHistory(history1, history2);

    console.log('📥 player1TPId:', player1TPId);
    console.log('📥 player2TPId:', player2TPId);
    console.log('📦 history1.length:', history1.length);
    console.log('📦 history2.length:', history2.length);
    console.log('📈 merged preview:', merged?.slice?.(0, 3));

    return res.json(merged);
  } catch (err) {
    console.error("❌ Greška u getMergedTrueSkillHistory:", err.message);
    return res.status(500).json({ message: "❌ Server error" });
  }
});

export default router;
