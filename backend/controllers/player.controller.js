import Player from "../models/playerDetails.model.js";
import Match from "../models/match.model.js";
import TrueSkillHistory from "../models/TrueSkillHistory.model.js";

export async function getAllPlayers(req, res) {
    try {
        const players = await Player.find()
            .populate("CountryTPId")
            .populate("PlaysId")

        res.json(players);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function createPlayer(req, res) {
    const { player } = req.body;

    const newPlayer = new Player({
        player
    });

    try {
        const savedPlayer = await newPlayer.save();
        res.status(201).json(savedPlayer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

export async function getPlayerById(req, res) {
    try {
        const player = await Player.findById(req.params.id);
        if (!player) return res.status(404).json({ message: "Player not found" });
        res.json(player);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function updatePlayer(req, res) {
    try {
        const updatedPlayer = await Player.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedPlayer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

export async function deletePlayer(req, res) {
    try {
        await Player.findByIdAndDelete(req.params.id);
        res.json({ message: "Player deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function getPaginatedPlayers(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;       // Trenutna stranica
        const pageSize = parseInt(req.query.pageSize) || 100; // Broj zapisa po stranici

        const sortField = req.query.sortField || 'playerName';
        const sortDirection = req.query.sortDirection === 'desc' ? -1 : 1;

        const allowedSortFields = ['playerName', 'playerBirthDate', 'trueSkillMean', 'careerTrueSkillMean'];
        const sortBy = allowedSortFields.includes(sortField) ? sortField : 'playerName';

        const tournamentTypeIds = req.query.tournamentTypeIds
        ? req.query.tournamentTypeIds.split(',').map(Number)
        : [2, 4];

        const filter = {};

        if (tournamentTypeIds.length > 0 && tournamentTypeIds.length < 2) {
            filter.tournamentTypeId = { $in: tournamentTypeIds };
        }

        const totalCount = await Player.countDocuments(filter); // Ukupan broj zapisa
        const totalPages = Math.ceil(totalCount / pageSize); // Ukupan broj stranica

        const players = await Player.find(filter)
            .sort({ [sortBy]: sortDirection })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate("countryTPId")
            .populate("playsId");

        console.log(`Sortiram po: ${sortBy}, smjer: ${sortDirection}`);
        res.status(200).json({
            players,
            pagination: {
                totalCount,
                totalPages,
                currentPage: page,
                pageSize,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function getPlayerWithMatches(req, res) {
    try {
        const playerTPId = parseInt(req.params.id);

        const player = await Player.findOne({ _id: playerTPId });

        if (!player) {
            return res.status(404).json({ message: "Player not found" });
        }

        const matches = await Match.find(
            {
                $or: [
                    { player1TPId: playerTPId },
                    { player2TPId: playerTPId }
                ]
            },
            {
                _id: 1,
                dateTime: 1,
                tournamentEventTPId: 1,
                player1Seed: 1,
                player1TPId: 1,
                player2Seed: 1,
                player2TPId: 1,
                result: 1,
                player1Odds: 1,
                player2Odds: 1,
                winProbabilityNN: 1
            }
        )
            .sort({ dateTime: -1 }) // najnoviji prvi
            .populate({
                path: "tournamentEventTPId",
                select: "tournamentEventName countryTPId tournamentLevelId tournamentTypeId",
                populate: [
                    {
                        path: "countryTPId",
                        select: "countryISO3 countryISO2 countryFull",
                    },
                    {
                        path: "tournamentLevelId",
                        select: "tournamentLevel",
                    },
                    {
                        path: "tournamentTypeId",
                        select: "tournamentType",
                    },
                ]
            })
            .populate({
                path: "player1TPId",
                select: "playerName countryTPId",
                populate: {
                    path: "countryTPId",
                    select: "countryISO3 countryISO2 countryFull",
                }
            })
            .populate({
                path: "player2TPId",
                select: "playerName countryTPId",
                populate: {
                    path: "countryTPId",
                    select: "countryISO3 countryISO2 countryFull",
                }
            });

        res.json({
            player,
            matchCount: matches.length,
            matches
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}

export async function searchPlayers(req, res) {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        const regex = new RegExp(query, "i"); // case-insensitive partial match

        const players = await Player.find({ playerName: { $regex: regex } })
            .limit(10)
            .select("playerName _id");

        res.json(players);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

// 📈 Dohvat TrueSkill vrijednosti kroz vrijeme za 2 igraca (za TS evolucijski grafikon)
export const getTrueSkillTimelineForPlayers = async (req, res) => {
    try {
      const { player1TPId, player2TPId } = req.query;
  
      if (!player1TPId || !player2TPId) {
        return res.status(400).json({ error: 'Both player1TPId and player2TPId are required' });
      }
  
      const playerIds = [parseInt(player1TPId), parseInt(player2TPId)];
  
      const records = await TrueSkillHistory.find({ playerTPId: { $in: playerIds } })
        .sort({ dateTime: 1 })
        .lean();
  
      const mergedTimeline = [];
      const timelineMap = new Map();
  
      for (const r of records) {
        const dateKey = new Date(r.dateTime).toISOString();
        const entry = timelineMap.get(dateKey) || { dateTime: dateKey };
  
        if (r.playerTPId === playerIds[0]) {
          entry.player1Mean = r.mean;
          entry.player1SD = r.sd;
        } else {
          entry.player2Mean = r.mean;
          entry.player2SD = r.sd;
        }
  
        timelineMap.set(dateKey, entry);
      }
  
      let lastMean1 = 25, lastSD1 = 8.33;
      let lastMean2 = 25, lastSD2 = 8.33;
  
      for (const [_, value] of timelineMap) {
        value.player1Mean = value.player1Mean ?? lastMean1;
        value.player1SD = value.player1SD ?? lastSD1;
        value.player2Mean = value.player2Mean ?? lastMean2;
        value.player2SD = value.player2SD ?? lastSD2;
  
        lastMean1 = value.player1Mean;
        lastSD1 = value.player1SD;
        lastMean2 = value.player2Mean;
        lastSD2 = value.player2SD;
  
        mergedTimeline.push(value);
      }
  
      res.json(mergedTimeline);
    } catch (err) {
      console.error('[getTrueSkillTimelineForPlayers] ❌ Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };