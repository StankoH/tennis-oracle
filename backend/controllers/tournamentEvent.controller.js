import TournamentEvent from "../models/tournamentEvent.model.js";
import Match from "../models/match.model.js";
import { DateTime } from 'luxon';

export async function getTournamentEventsByDate(req, res) {
    try {
        const { date } = req.params;

        const year = date.slice(0, 4);
        const month = date.slice(4, 6);
        const day = date.slice(6, 8);

        const startDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
        const endDate = new Date(`${year}-${month}-${day}T23:59:59.999Z`);

        const tournamentEvents = await TournamentEvent.find({
            tournamentEventDate: { $gte: startDate, $lte: endDate }
        })

        res.json(tournamentEvents);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

export async function getPaginatedTournamentSummariesByDate(req, res) {
    try {
        const { date } = req.params;

        const year = date.slice(0, 4);
        const month = date.slice(4, 6);
        const day = date.slice(6, 8);

        const localStart = DateTime.fromObject(
            { year: +year, month: +month, day: +day },
            { zone: 'Europe/Zagreb' }
        ).startOf('day');

        const localEnd = localStart.plus({ days: 1 });

        const startDate = localStart.toUTC().toJSDate();
        const endDate = localEnd.toUTC().toJSDate();

        const tournamentEvents = await TournamentEvent.find(
            { tournamentEventDate: { $gte: startDate, $lt: endDate } },
            {
                _id: 1,
                tournamentEventName: 1,
                tournamentEventDate: 1,
                countryTPId: 1,
                countryISO2: 1,
                countryISO3: 1,
                countryFull: 1,
                tournamentLevelId: 1,
                tournamentLevel: 1,
                tournamentTypeId: 1,
                tournamentType: 1,
                surfaceId: 1,
                surface: 1,
                prize: 1,
                matches: 1
            }
        )

        res.status(200).json({ tournamentEvents });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function getTournamentDateRange(req, res) {
    try {
        const result = await TournamentEvent.aggregate([
            {
                $group: {
                    _id: null,
                    minDate: { $min: '$tournamentEventDate' },
                    maxDate: { $max: '$tournamentEventDate' }
                }
            }
        ]);

        if (!result.length) {
            return res.status(404).json({ message: 'No tournament events found' });
        }

        const { minDate, maxDate } = result[0];
        res.json({ minDate, maxDate });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}

export async function getAvailableTournamentDates(req, res) {
    try {
        const dates = await TournamentEvent.aggregate([
            {
                $project: {
                    dateStr: {
                        $dateToString: { format: "%Y-%m-%d", date: "$tournamentEventDate" }
                    }
                }
            },
            {
                $group: { _id: "$dateStr" }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const dateList = dates.map(d => d._id);
        res.status(200).json(dateList);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch available dates' });
    }
}

export async function filterTournamentEvents(req, res) {
    try {
        const {
            surfaceId,
            tournamentTypeId,
            tournamentLevelId,
            dateFilter,
            from,
            to,
            startDate,
            endDate,
            page,
            limit
        } = req.query;

        const filter = {};
        const today = new Date();
        const dateRange = {};

        // 1️⃣ DATUMSKI FILTER
        if (dateFilter && dateFilter !== 'all') {
            switch (dateFilter) {
                case 'year':
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

        if (Object.keys(dateRange).length === 0) {
            dateRange.$gte = new Date(today.setFullYear(today.getFullYear() - 1));
        }

        filter.tournamentEventDate = dateRange;

        // 2️⃣ FILTERI
        if (surfaceId) filter.surfaceId = Array.isArray(surfaceId)
            ? { $in: surfaceId.map(id => parseInt(id)) }
            : parseInt(surfaceId);

        if (tournamentTypeId) filter.tournamentTypeId = parseInt(tournamentTypeId);
        if (tournamentLevelId) filter.tournamentLevelId = parseInt(tournamentLevelId);

        // 3️⃣ PAGINACIJA
        const parsedLimit = parseInt(limit) || 50;
        const parsedPage = parseInt(page) || 1;

        const tournamentEvents = await TournamentEvent.find(filter)
            .sort({ tournamentEventDate: -1 })
            .skip((parsedPage - 1) * parsedLimit)
            .limit(parsedLimit)

        res.status(200).json(tournamentEvents);

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}

export async function filterTournamentEventsByDateRange(req, res) {
    try {
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({ message: "'from' and 'to' query parameters are required" });
        }

        const fromDate = new Date(from);
        const toDate = new Date(to);
        toDate.setUTCHours(23, 59, 59, 999);

        const tournamentEvents = await TournamentEvent.find({
            tournamentEventDate: {
                $gte: fromDate,
                $lte: toDate
            }
        }).sort({ tournamentEventDate: 1 });

        res.json(tournamentEvents);

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getPaginatedTournamentEvents(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 100;

        const sortField = req.query.sortField || "tournamentEventName";
        const sortDirection = req.query.sortDirection === "desc" ? -1 : 1;

        const allowedSortFields = ["tournamentEventName", "tournamentEventDate", "prize"];
        const sortBy = allowedSortFields.includes(sortField) ? sortField : "tournamentEventName";

        const totalCount = await TournamentEvent.countDocuments();
        const totalPages = Math.ceil(totalCount / pageSize);

        const tournamentEvents = await TournamentEvent.find({}, {
            _id: 1,
            tournamentEventName: 1,
            tournamentEventDate: 1,
            countryTPId: 1,
            countryISO2: 1,
            countryISO3: 1,
            countryFull: 1,
            tournamentLevelId: 1,
            tournamentLevel: 1,
            tournamentTypeId: 1,
            tournamentType: 1,
            surfaceId: 1,
            surface: 1,
            prize: 1,
            matches: 1
        })
            .sort({ [sortBy]: sortDirection })
            .skip((page - 1) * pageSize)
            .limit(pageSize);

        res.status(200).json({
            tournamentEvents,
            pagination: {
                totalCount,
                totalPages,
                currentPage: page,
                pageSize
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}
