import Match from "../models/match.model.js";
import TournamentEvent from "../models/tournamentEvent.model.js";
import { DateTime } from 'luxon';

export async function getAllMatches(req, res) {
    try {
        const matches = await Match.find()
        res.json(matches);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function createMatch(req, res) {
    const { match } = req.body;

    const newMatch = new Match({
        match
    });

    try {
        const savedMatch = await newMatch.save();
        res.status(201).json(savedMatch);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

export async function getMatchById(req, res) {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ message: "Match not found" });
        res.json(match);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function updateMatch(req, res) {
    try {
        const updatedMatch = await Match.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedMatch);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

export async function deleteMatch(req, res) {
    try {
        await Match.findByIdAndDelete(req.params.id);
        res.json({ message: "Match deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function getMatchesByDate(req, res) {
    try {
        const { date } = req.params;

        // Pretvaranje YYYYMMDD u ISO datume
        const year = date.slice(0, 4);
        const month = date.slice(4, 6);
        const day = date.slice(6, 8);

        const startDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
        const endDate = new Date(`${year}-${month}-${day}T23:59:59.999Z`);

        const matches = await Match.find({
            dateTime: { $gte: startDate, $lte: endDate }
        })

        res.json(matches);
    } catch (error) {
        console.error("Error fetching matches by date:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export async function getPaginatedMatches(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;       // Trenutna stranica
        const pageSize = parseInt(req.query.pageSize) || 10000; // Broj zapisa po stranici

        const totalCount = await Match.countDocuments(); // Ukupan broj zapisa
        const totalPages = Math.ceil(totalCount / pageSize); // Ukupan broj stranica

        const matches = await Match.find()
            .skip((page - 1) * pageSize)
            .limit(pageSize);

        res.status(200).json({
            matches,
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

export async function getPaginatedMatchSummariesByDate(req, res) {
    try {
        const { date } = req.params;

        // Pretvaranje YYYYMMDD u ISO datume
        const year = date.slice(0, 4);
        const month = date.slice(4, 6);
        const day = date.slice(6, 8);

        const localStart = DateTime.fromObject(
            { year: +year, month: +month, day: +day },
            { zone: 'Europe/Zagreb' }
        ).startOf('day');

        const localEnd = localStart.plus({ days: 1 });

        const startDate = localStart.toUTC().toJSDate(); // UTC granica od 00:00
        const endDate = localEnd.toUTC().toJSDate();     // UTC granica do 00:00 sljedećeg dana

        const totalCount = await Match.countDocuments({
            dateTime: { $gte: startDate, $lt: endDate }
        });

        const matches = await Match.find(
            {
                dateTime: { $gte: startDate, $lt: endDate }
            },
            {
                _id: 1,
                dateTime: 1,
                tournamentEventTPId: 1,
                tournamentEventCountryTPId: 1,
                tournamentEventCountryISO2: 1,
                tournamentEventCountryISO3: 1,
                tournamentEventCountryFull: 1,
                tournamentEventName: 1,
                surfaceId: 1,
                surface: 1,
                tournamentLevelId: 1,
                tournamentLevel: 1,
                tournamentTypeId: 1,
                tournamentType: 1,
                player1TPId: 1,
                player1CountryTPId: 1,
                player1CountryISO2: 1,
                player1CountryISO3: 1,
                player1CountryFull: 1,
                player1Name: 1,
                player1Seed: 1,
                player2TPId: 1,
                player2CountryTPId: 1,
                player2CountryISO2: 1,
                player2CountryISO3: 1,
                player2CountryFull: 1,
                player2Name: 1,
                player2Seed: 1,
                result: 1,
                resultDetails: 1,
                player1Odds: 1,
                player2Odds: 1,
                prize: 1,
                winProbabilityPlayer1NN: 1,
                winProbabilityPlayer2NN: 1,
                valueMarginPlayer1: 1,
                valueMarginPlayer2: 1,
                who2Bet: 1
            }
        )

        res.status(200).json({
            matches
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function filterMatchesByDateRange(req, res) {
    try {
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({ message: "'from' and 'to' query parameters are required" });
        }

        const fromDate = new Date(from);
        const toDate = new Date(to);
        toDate.setUTCHours(23, 59, 59, 999);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format. Use ISO format (YYYY-MM-DD)" });
        }

        // Uključi i krajnje datume
        const matches = await Match.find({
            dateTime: {
                $gte: fromDate,
                $lte: toDate
            }
        }).sort({ dateTime: 1 });

        res.json(matches);

    } catch (error) {
        console.error('❌ Error in filterMatchesByDateRange:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function filterMatches(req, res) {
    try {
        const {
            countryId,
            surfaceId,
            tournamentTypeId,
            tournamentLevelId,
            startDate,
            endDate,
            dateFilter,
            from,
            to,
            page,
            limit
        } = req.query;

        console.log('surfaceId from query:', req.query.surfaceId);

        const matchQuery = {};
        const today = new Date();
        const dateRange = {};

        // 📌 1. DATE FILTER (obavezno!)
        if (dateFilter && dateFilter !== 'all') {
            switch (dateFilter) {
                case 'year':
                    // dateRange.$gte = new Date(today.setFullYear(today.getFullYear() - 1));
                    // dateRange.$lte = new Date(today.setFullYear(today.getFullYear()));
                    if (from) dateRange.$gte = new Date(today.setFullYear(today.getFullYear() - 1));
                    if (to) dateRange.$lte = new Date(today.setFullYear(today.getFullYear()));
                    break;
                case 'month':
                    dateRange.$gte = new Date(today.setMonth(today.getMonth() - 1));
                    break;
                case 'week':
                    dateRange.$gte = new Date(today.setDate(today.getDate() - 7));
                    break;
                case 'custom':
                    if (from) dateRange.$gte = new Date(from);
                    if (to) dateRange.$lte = new Date(to);
                    break;
            }
        } else if (startDate || endDate) {
            if (startDate) dateRange.$gte = new Date(startDate);
            if (endDate) dateRange.$lte = new Date(endDate);
        }

        // ➕ DEFAULT: zadnjih 365 dana ako nije specificirano ništa
        if (Object.keys(dateRange).length === 0) {
            dateRange.$gte = new Date(today.setFullYear(today.getFullYear() - 1));
        }

        matchQuery.dateTime = dateRange;

        // 🏟️ 2. TOURNAMENT FILTERS
        const tournamentFilter = {};
        if (countryId) tournamentFilter.countryTPId = parseInt(countryId);
        if (tournamentTypeId) tournamentFilter.tournamentTypeId = parseInt(tournamentTypeId);
        if (tournamentLevelId) tournamentFilter.tournamentLevelId = parseInt(tournamentLevelId);

        if (Object.keys(tournamentFilter).length > 0) {
            const tournamentEvents = await TournamentEvent.find(tournamentFilter).select('_id');
            const tournamentEventIds = tournamentEvents.map(t => t._id);
            matchQuery.tournamentEventTPId = { $in: tournamentEventIds };
        }

        // 🎾 3. SURFACE FILTER
        const parsedSurfaceIds = Array.isArray(surfaceId)
            ? surfaceId.map(id => parseInt(id))
            : surfaceId ? [parseInt(surfaceId)] : [];

        if (parsedSurfaceIds.length === 1) {
            matchQuery.surfaceId = parsedSurfaceIds[0];
        } else if (parsedSurfaceIds.length > 1) {
            matchQuery.surfaceId = { $in: parsedSurfaceIds };
        }

        // 🔍 4. QUERY
        const query = Match.find(matchQuery).sort({ dateTime: -1 });

        // 🧠 .hint() SAMO ako je `surfaceId` i `dateTime` prisutan
        const useHint = parsedSurfaceIds.length > 0;
        if (useHint) {
            query.hint({ surfaceId: 1, dateTime: -1 });
        }

        // 📄 5. PAGINATION
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const skip = (!isNaN(parsedPage) && parsedPage > 0)
            ? (parsedPage - 1) * parsedLimit
            : 0;

        if (!isNaN(parsedLimit) && parsedLimit > 0) {
            query.skip(skip).limit(parsedLimit);
        }

        // 🧪 6. EXPLAIN (dev only)
        if (process.env.NODE_ENV !== 'production') {
            const explainResult = await query.clone().explain('executionStats');
            const stats = explainResult.executionStats;
            console.log('MATCH INDEXES:', await Match.collection.indexes());
            console.log('Execution Time (ms):', stats.executionTimeMillis);
            console.log('Total Documents Examined:', stats.totalDocsExamined);
            console.log('Documents Returned:', stats.nReturned);
            console.log('Index Used:',
                explainResult.queryPlanner.winningPlan.inputStage?.indexName ||
                explainResult.queryPlanner.winningPlan.inputStage?.inputStage?.indexName ||
                'N/A'
            );
        }

        // ✅ 7. EXECUTE
        const matches = await query;
        res.json(matches);

    } catch (err) {
        console.error('filterMatches error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getMatchDateRange(req, res) {
    try {
      const result = await Match.aggregate([
        {
          $group: {
            _id: null,
            minDate: { $min: '$dateTime' },
            maxDate: { $max: '$dateTime' }
          }
        }
      ]);
  
      if (!result.length) {
        return res.status(404).json({ message: 'No matches found' });
      }
  
      const { minDate, maxDate } = result[0];
      res.json({ minDate, maxDate });
    } catch (error) {
      console.error('❌ getMatchDateRange error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  }
  
  export async function getAvailableDates(req, res) {
    try {
      const dates = await Match.aggregate([
        {
          $project: {
            dateStr: {
              $dateToString: { format: "%Y-%m-%d", date: "$dateTime" }
            }
          }
        },
        {
          $group: {
            _id: "$dateStr"
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
  
      const dateList = dates.map(d => d._id);
      res.status(200).json(dateList);
    } catch (err) {
      console.error('❌ Error fetching available dates (fallback):', err);
      res.status(500).json({ message: 'Failed to fetch available dates' });
    }
  }
;