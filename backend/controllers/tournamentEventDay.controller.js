import TournamentEventDay from "../models/tournamentEventDay.model.js";

export async function getTournamentEventsByDay(req, res) {
  try {
    const { date } = req.params; // format: YYYYMMDD

    const year = date.slice(0, 4);
    const month = date.slice(4, 6);
    const day = date.slice(6, 8);

    const startDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    const endDate = new Date(`${year}-${month}-${day}T23:59:59.999Z`);

    const tournaments = await TournamentEventDay.find({
      matchDate: { $gte: startDate, $lte: endDate }
    });

    res.json({ tournaments });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}