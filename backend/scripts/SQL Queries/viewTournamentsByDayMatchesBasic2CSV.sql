ALTER VIEW [dbo].[tournamentEventDay2CSV] AS
WITH MatchCounts AS (
    SELECT 
        m.TournamentEventTPId,
        COUNT(DISTINCT m.MatchTPId) AS MatchCount
    FROM Match m
    WHERE m.DateTime >= '2022-01-01'
      AND m.Result IN ('20', '21', '30', '31', '32')
    GROUP BY m.TournamentEventTPId
),
DailyTournamentData AS (
    SELECT DISTINCT
        CAST(m.TournamentEventTPId AS VARCHAR) AS tournamentEventTPId,
        CAST(CONVERT(date, m.DateTime) AS VARCHAR) AS matchDate,
        dbo.RemoveRomanSuffix(REPLACE(te.TournamentEventName, '&#39;', '''')) AS tournamentEventName,
        CAST(te.CountryTPId AS VARCHAR) AS countryTPId,
        c.CountryISO2,
        c.CountryISO3,
        REPLACE(c.CountryFull, '&#39;', '''') AS countryFull,
        CAST(te.TournamentLevelId AS VARCHAR) AS tournamentLevelId,
        CASE 
            WHEN te.TournamentLevelId = 1 THEN '> 50,000$'
            WHEN te.TournamentLevelId = 2 THEN 'Cup'
            WHEN te.TournamentLevelId = 3 THEN 'Qualifications'
            WHEN te.TournamentLevelId = 4 THEN '< 50,000$'
            ELSE NULL
        END AS tournamentLevel,
        CAST(te.TournamentTypeId AS VARCHAR) AS tournamentTypeId,
        CASE 
            WHEN tt.TournamentTypeId = 2 THEN 'ATP'
            WHEN tt.TournamentTypeId = 4 THEN 'WTA'
            ELSE NULL
        END AS tournamentType,
        CAST(te.SurfaceId AS VARCHAR) AS surfaceId,
        s.Surface AS surface,
        ISNULL(CAST(FORMAT(te.Prize, 'N2') AS varchar), '') AS prize,
		CAST(ISNULL(mc.MatchCount, 0) AS VARCHAR) AS matches
    FROM Match m
    INNER JOIN TournamentEvent te ON m.TournamentEventTPId = te.TournamentEventTPId
    LEFT JOIN Country c ON te.CountryTPId = c.CountryTPId
    LEFT JOIN TournamentLevel tl ON te.TournamentLevelId = tl.TournamentLevelId
    LEFT JOIN TournamentType tt ON te.TournamentTypeId = tt.TournamentTypeId
    LEFT JOIN Surface s ON te.SurfaceId = s.SurfaceId
	LEFT JOIN MatchCounts mc ON te.TournamentEventTPId = mc.TournamentEventTPId
    WHERE m.DateTime >= '2022-01-01'
      AND m.Result IN ('20', '21', '30', '31', '32') -- finished matches only
)
SELECT TOP 10000000
    '"' + tournamentEventTPId + '"' AS tournamentEventTPId,
    '"' + matchDate + '"' AS matchDate,
    '"' + tournamentEventName + '"' AS tournamentEventName,
    '"' + countryTPId + '"' AS countryTPId,
    '"' + countryISO2 + '"' AS countryISO2,
    '"' + countryISO3 + '"' AS countryISO3,
    '"' + countryFull + '"' AS countryFull,
    '"' + tournamentLevelId + '"' AS tournamentLevelId,
    '"' + tournamentLevel + '"' AS tournamentLevel,
    '"' + tournamentTypeId + '"' AS tournamentTypeId,
    '"' + tournamentType + '"' AS tournamentType,
    '"' + surfaceId + '"' AS surfaceId,
    '"' + surface + '"' AS surface,
    '"' + prize + '"' AS prize,
	'"' + matches + '"' AS matches
FROM DailyTournamentData
ORDER BY matchDate DESC;
