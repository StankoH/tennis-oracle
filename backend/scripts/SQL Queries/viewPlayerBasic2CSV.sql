ALTER VIEW [dbo].[PlayersBasic2CSV] AS
WITH PlayerTSHistory AS (
    SELECT Player1TPId AS PlayerTPId, Player1TrueSkillMeanM, Player1TrueSkillMeanSM, Player1TrueSkillMeanGSM FROM Match
    UNION ALL
    SELECT Player2TPId, Player2TrueSkillMeanM, Player2TrueSkillMeanSM, Player2TrueSkillMeanGSM FROM Match
),
PlayerTSCareerAvg AS (
    SELECT PlayerTPId, ROUND(AVG((Player1TrueSkillMeanM + Player1TrueSkillMeanSM + Player1TrueSkillMeanGSM) / 3.0), 2) AS TSCareerAvg
    FROM PlayerTSHistory
    GROUP BY PlayerTPId
),
RecentMatchPlayers AS (
    SELECT DISTINCT Player1TPId AS PlayerTPId FROM Match
    UNION
    SELECT DISTINCT Player2TPId AS PlayerTPId FROM Match
),
PlayerMatchCounts AS (
    SELECT PlayerTPId, TournamentTypeId, COUNT(*) AS MatchCount
    FROM (
        SELECT m.Player1TPId AS PlayerTPId, te.TournamentTypeId
        FROM Match m
        JOIN TournamentEvent te ON m.TournamentEventTPId = te.TournamentEventTPId
        WHERE te.TournamentTypeId IN (2, 4)
        UNION ALL
        SELECT m.Player2TPId AS PlayerTPId, te.TournamentTypeId
        FROM Match m
        JOIN TournamentEvent te ON m.TournamentEventTPId = te.TournamentEventTPId
        WHERE te.TournamentTypeId IN (2, 4)
    ) AS base
    GROUP BY PlayerTPId, TournamentTypeId
),
FinalPlayerTournamentType AS (
    SELECT pmc.PlayerTPId,
        CASE
            WHEN COUNT(*) = 1 THEN MAX(pmc.TournamentTypeId)
            WHEN MAX(pmc.MatchCount) = MIN(pmc.MatchCount) THEN NULL
            ELSE MAX(CASE WHEN pmc.MatchCount = mc.MaxMatchCount THEN pmc.TournamentTypeId END)
        END AS TournamentTypeId
    FROM PlayerMatchCounts pmc
    JOIN (
        SELECT PlayerTPId, MAX(MatchCount) AS MaxMatchCount
        FROM PlayerMatchCounts
        GROUP BY PlayerTPId
    ) mc ON pmc.PlayerTPId = mc.PlayerTPId
    GROUP BY pmc.PlayerTPId
),
PlayerData AS (
    SELECT CAST(1 AS INT) AS RowNum,
        '"playerTPId"' AS playerTPId,
        '"playerName"' AS playerName,
        '"countryTPId"' AS countryTPId,
        '"countryISO2"' AS countryISO2,
        '"countryISO3"' AS countryISO3,
        '"countryFull"' AS countryFull,
        '"playerBirthDate"' AS playerBirthDate,
        '"age"' AS age,
        '"playerHeight"' AS playerHeight,
        '"playerWeight"' AS playerWeight,
        '"playerTurnedPro"' AS playerTurnedPro,
        '"playsId"' AS playsId,
        '"plays"' AS plays,
        '"tournamentTypeId"' AS tournamentTypeId,
        '"tournamentType"' AS tournamentType,
        '"winRatio"' AS winRatio,
        '"matches"' AS matches,
        '"trueSkillMean"' AS trueSkillMean,
        '"careerTrueSkillMean"' AS careerTrueSkillMean
    UNION ALL
    SELECT CAST(2 AS INT) AS RowNum,
        '"' + ISNULL(CAST(p.PlayerTPId AS varchar), '') + '"',
        '"' + REPLACE(ISNULL(p.PlayerName, ''), '&#39;', '''') + '"',
        '"' + ISNULL(CAST(p.CountryTPId AS varchar), '') + '"',
        '"' + ISNULL(c.CountryISO2, '') + '"',
        '"' + ISNULL(c.CountryISO3, '') + '"',
        '"' + REPLACE(ISNULL(c.CountryFull, ''), '&#39;', '''') + '"',
        '"' + ISNULL(CONVERT(varchar, p.PlayerBirthDate, 23), '') + '"',
        '"' + ISNULL(CAST(CASE WHEN p.PlayerBirthDate IS NOT NULL THEN DATEDIFF(YEAR, p.PlayerBirthDate, GETDATE()) - CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, p.PlayerBirthDate, GETDATE()), p.PlayerBirthDate) > GETDATE() THEN 1 ELSE 0 END ELSE NULL END AS VARCHAR), '') + '"',
        '"' + ISNULL(CAST(p.PlayerHeight AS varchar), '') + '"',
        '"' + ISNULL(CAST(p.PlayerWeight AS varchar), '') + '"',
        '"' + ISNULL(CAST(p.PlayerTurnedPro AS varchar), '') + '"',
        '"' + ISNULL(CAST(p.PlaysId AS varchar), '') + '"',
        '"' + ISNULL(ps.Plays, '') + '"',
        '"' + ISNULL(CAST(fptt.TournamentTypeId AS varchar), '') + '"',
        '"' + CASE WHEN CAST(fptt.TournamentTypeId AS VARCHAR) = '2' THEN 'ATP' WHEN CAST(fptt.TournamentTypeId AS VARCHAR) = '4' THEN 'WTA' ELSE '' END + '"',
        '"' + ISNULL(LTRIM(REPLACE(STR(CASE WHEN (p.WinsTotal + p.LossesTotal) > 0 THEN (CAST(p.WinsTotal AS FLOAT) / (p.WinsTotal + p.LossesTotal)) * 100 ELSE NULL END, 10, 2), ',', '.')), '') + '"',
        '"' + ISNULL(CAST(p.WinsTotal + p.LossesTotal AS varchar), '') + '"',
        '"' + ISNULL(LTRIM(REPLACE(STR(ROUND((CAST(p.TrueSkillMeanM AS FLOAT) + CAST(p.TrueSkillMeanSM AS FLOAT) + CAST(p.TrueSkillMeanGSM AS FLOAT)) / 3.0, 2), 10, 2), ',', '.')), '') + '"',
        '"' + ISNULL(LTRIM(REPLACE(STR(tsavg.TSCareerAvg, 10, 2), ',', '.')), '') + '"'
    FROM Player p
    LEFT JOIN Country c ON p.CountryTPId = c.CountryTPId
    LEFT JOIN Plays ps ON ps.PlaysId = p.PlaysId
    LEFT JOIN PlayerTSCareerAvg tsavg ON tsavg.PlayerTPId = p.PlayerTPId
    LEFT JOIN RecentMatchPlayers rmp ON rmp.PlayerTPId = p.PlayerTPId
    LEFT JOIN FinalPlayerTournamentType fptt ON p.PlayerTPId = fptt.PlayerTPId
    LEFT JOIN TournamentType tt ON tt.TournamentTypeId = fptt.TournamentTypeId
    WHERE rmp.PlayerTPId IS NOT NULL AND
	p.PlayerTPId in 
	(select distinct p.pid from
	(select distinct(m.Player1TPId) as pid from Match m WHERE m.DateTime >= '2022-01-01' AND m.Result in ('20', '21', '30', '31', '32')
	 union
	 select distinct(m.Player2TPId) as pid from Match m WHERE m.DateTime >= '2022-01-01' AND m.Result in ('20', '21', '30', '31', '32')
	) as p)
)
SELECT
    playerTPId,
    playerName,
    countryTPId,
    countryISO2,
    countryISO3,
    countryFull,
    playerBirthDate,
    age,
    playerHeight,
    playerWeight,
    playerTurnedPro,
    playsId,
    plays,
    tournamentTypeId,
    tournamentType,
    winRatio,
    matches,
    trueSkillMean,
    careerTrueSkillMean
FROM PlayerData;
