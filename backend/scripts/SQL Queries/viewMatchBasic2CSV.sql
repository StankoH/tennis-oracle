ALTER view [dbo].[matchBasic2CSV] as
WITH MatchData AS (
  SELECT top 10000000
    CAST(1 AS varchar) AS RowNum,
    '"matchTPId"' AS matchTPId,
    '"dateTime"' AS dateTime,
    '"tournamentEventTPId"' AS tournamentEventTPId,
	'"tournamentEventCountryTPId"' AS tournamentEventCountryTPId,
	'"tournamentEventCountryISO2"' AS tournamentEventCountryISO2,
	'"tournamentEventCountryISO3"' AS tournamentEventCountryISO3,
	'"tournamentEventCountryFull"' AS tournamentEventCountryFull,
    '"tournamentEventName"' AS tournamentEventName,
    '"surfaceId"' AS surfaceId,
    '"surface"' AS surface,
    '"tournamentLevelId"' AS tournamentLevelId,
    '"tournamentLevel"' AS tournamentLevel,
    '"tournamentTypeId"' AS tournamentTypeId,
    '"tournamentType"' AS tournamentType,
    '"player1TPId"' AS player1TPId,
	'"player1CountryTPId"' AS player1CountryTPId,
	'"player1CountryISO2"' AS player1CountryISO2,
	'"player1CountryISO3"' AS player1CountryISO3,
	'"player1CountryFull"' AS player1CountryFull,
    '"player1Name"' AS player1Name,
    '"player2TPId"' AS player2TPId,
	'"player2CountryTPId"' AS player2CountryTPId,
	'"player2CountryISO2"' AS player2CountryISO2,
	'"player2CountryISO3"' AS player2CountryISO3,
	'"player2CountryFull"' AS player2CountryFull,
    '"player2Name"' AS player2Name,
    '"result"' AS result,
    '"resultDetails"' AS resultDetails,
    '"player1Odds"' AS player1Odds,
    '"player2Odds"' AS player2Odds,
    '"prize"' AS prize,
    '"winProbabilityPlayer1NN"' AS winProbabilityPlayer1NN,
    '"winProbabilityPlayer2NN"' AS winProbabilityPlayer2NN,
	'"valueMarginPlayer1"' AS valueMarginPlayer1,
	'"valueMarginPlayer2"' AS valueMarginPlayer2,
	'"who2Bet"' AS who2Bet
  UNION ALL
  SELECT top 10000000
  CAST(2 AS varchar) AS RowNum,
    '"' + CAST(m.MatchTPId AS varchar) + '"' AS matchTPId,
    '"' + CAST(FORMAT(m.DateTime, 'yyyy-MM-dd HH:mm:ss') AS varchar) + '"' AS dateTime,
    '"' + CAST(m.TournamentEventTPId AS varchar) + '"' AS tournamentEventTPId,
	'"' + CAST(te.CountryTPId AS varchar) + '"' AS tournamentEventCountryTPId,
    '"' + ct.CountryISO2 + '"' AS tournamentEventCountryISO2,
    '"' + ct.CountryISO3 + '"' AS tournamentEventCountryISO3,
	'"' + CAST(REPLACE(ct.CountryFull, '&#39;', '''') AS varchar) + '"' AS tournamentEventCountryFull,
    '"' + CAST(dbo.RemoveRomanSuffix(te.TournamentEventName) AS VARCHAR(200)) + '"' AS tournamentEventName,
    '"' + CAST(te.SurfaceId AS varchar) + '"' AS surfaceId,
    '"' + s.Surface + '"' AS surface,
    '"' + CAST(tl.TournamentLevelId AS varchar) + '"' AS tournamentLevelId,
    '"' + case when tl.TournamentLevelId = 1 THEN '> 50,000$' when tl.TournamentLevelId = 2 THEN 'Cup' WHEN tl.TournamentLevelId = 3 then 'Qualifications' when tl.TournamentLevelId = 4 then '< 50,000$' else '' END + '"' AS tournamentLevel,
    '"' + CAST(tt.TournamentTypeId AS varchar) + '"' AS tournamentTypeId,
    '"' + CASE when tt.TournamentTypeId = 2 then 'ATP' when tt.TournamentTypeId = 4 then 'WTA' ELSE '' END + '"' AS tournamentType,
    '"' + CAST(m.Player1TPId AS varchar) + '"' AS player1TPId,
	'"' + CAST(cp1.CountryTPId AS varchar) + '"' AS player1CountryTPId,
    '"' + cp1.CountryISO2 + '"' AS player1CountryISO2,
    '"' + cp1.CountryISO3 + '"' AS player1CountryISO3,
    '"' + cp1.CountryFull + '"' AS player1CountryFull,
    '"' + REPLACE(REPLACE(p1.PlayerName, '&#39;', '''') + ' (' + LTRIM(m.Player1Seed) + ')', ' ()', '') + '"' AS player1Name,
    '"' + CAST(m.Player2TPId AS varchar) + '"' AS player2TPId,
	'"' + CAST(cp2.CountryTPId AS varchar) + '"' AS player2CountryTPId,
    '"' + cp2.CountryISO2 + '"' AS player2CountryISO2,
    '"' + cp2.CountryISO3 + '"' AS player2CountryISO3,
    '"' + REPLACE(cp2.CountryFull, '&#39;', '''') + '"' AS player2CountryFull,
    '"' + REPLACE(REPLACE(p2.PlayerName, '&#39;', '''') + ' (' + LTRIM(m.Player2Seed) + ')', ' ()', '') + '"' AS player2Name,
    '"' + ISNULL((left(m.Result, 1) + ':' + right(m.Result, 1)), '') + '"' AS result,
	'"' + CAST(dbo.FormatResultDetails(m.resultDetails) AS VARCHAR(MAX)) + '"' AS resultDetails,
	'"' + CAST(ROUND(m.Player1Odds, 2) AS varchar) + '"' AS player1Odds,
	'"' + CAST(ROUND(m.Player2Odds, 2) AS varchar) + '"' AS player2Odds,
    '"' + ISNULL(CAST(FORMAT(te.Prize, 'N2') AS varchar), '') + '"' AS prize,
	'"' + FORMAT(m.WinProbabilityNN * 100.0, 'N2') + '"' AS winProbabilityPlayer1NN,
	'"' + FORMAT((1.0 - m.WinProbabilityNN) * 100.0, 'N2') + '"' AS winProbabilityPlayer2NN,
	'"' + FORMAT((m.Player1Odds - (1.0 / m.WinProbabilityNN)) * 100.0, 'N2') + '"' AS valueMarginPlayer1,
	'"' + FORMAT((m.Player2Odds - (1.0 / (1.0 - m.WinProbabilityNN))) * 100.0, 'N2') + '"' AS valueMarginPlayer2,
	'"' + 
	  CASE 
		WHEN (m.Player1Odds - (1.0 / m.WinProbabilityNN)) > (m.Player2Odds - (1.0 / (1.0 - m.WinProbabilityNN))) 
			 AND (m.Player1Odds - (1.0 / m.WinProbabilityNN)) > 0 THEN '1'
		WHEN (m.Player2Odds - (1.0 / (1.0 - m.WinProbabilityNN))) > (m.Player1Odds - (1.0 / m.WinProbabilityNN)) 
			 AND (m.Player2Odds - (1.0 / (1.0 - m.WinProbabilityNN))) > 0 THEN '2'
		ELSE '0'
	  END + '"' AS who2Bet
	FROM Match m
    JOIN TournamentEvent te ON m.TournamentEventTPId = te.TournamentEventTPId
    JOIN TournamentLevel tl ON te.TournamentLevelId = tl.TournamentLevelId
    JOIN TournamentType tt ON te.TournamentTypeId = tt.TournamentTypeId
    JOIN Surface s ON te.SurfaceId = s.SurfaceId
	JOIN Player p1 ON m.Player1TPId = p1.PlayerTPId
    JOIN Player p2 ON m.Player2TPId = p2.PlayerTPId
    JOIN Country ct ON te.CountryTPId = ct.CountryTPId
    JOIN Country cp1 ON p1.CountryTPId = cp1.CountryTPId
    JOIN Country cp2 ON p2.CountryTPId = cp2.CountryTPId

  WHERE m.DateTime >= '2022-01-01' AND m.Result in ('20', '21', '30', '31', '32') order by m.DateTime
)
SELECT
  matchTPId, dateTime, tournamentEventTPId, tournamentEventCountryTPId, tournamentEventCountryISO2, tournamentEventCountryISO3, tournamentEventCountryFull, tournamentEventName, surfaceId,
  surface, tournamentLevelId, tournamentLevel, tournamentTypeId, tournamentType,
  player1TPId, player1CountryTPId, player1CountryISO2, player1CountryISO3, player1CountryFull, player1Name,
  player2CountryTPId, player2CountryISO2, player2CountryISO3, player2CountryFull, player2TPId, player2Name,
  result, resultDetails, player1Odds, player2Odds, prize,
  winProbabilityPlayer1NN, winProbabilityPlayer2NN, valueMarginPlayer1, valueMarginPlayer2, who2Bet
FROM MatchData;
GO