ALTER VIEW [dbo].[tournamentsMatchesBasic2CSV] AS
WITH TournamentMatches AS (
    SELECT TOP 10000000
        m.MatchTPId,
        m.DateTime,
        m.TournamentEventTPId,
        te.CountryTPId AS TournamentEventCountryTPId,
        ct.CountryISO2 AS TournamentEventCountryISO2,
        ct.CountryISO3 AS TournamentEventCountryISO3,
        ct.CountryFull AS TournamentEventCountryFull,
        dbo.RemoveRomanSuffix(te.TournamentEventName) AS TournamentEventName,
        te.SurfaceId,
        s.Surface,
        te.TournamentLevelId,
        CASE WHEN te.TournamentLevelId = 1 THEN '> 50.000$' WHEN te.TournamentLevelId = 2 THEN 'Cup' WHEN te.TournamentLevelId = 3 THEN 'Qualifications' WHEN te.TournamentLevelId = 4 THEN '< 50.000$'ELSE '' END AS TournamentLevel,
        te.TournamentTypeId,
        CASE WHEN te.TournamentTypeId = 2 THEN 'ATP'WHEN te.TournamentTypeId = 4 THEN 'WTA' ELSE '' END AS TournamentType,
        m.Player1TPId,
        p1.PlayerName AS Player1Name,
        cp1.CountryTPId AS Player1CountryTPId,
        cp1.CountryISO2 AS Player1CountryISO2,
        cp1.CountryISO3 AS Player1CountryISO3,
        cp1.CountryFull AS Player1CountryFull,
        m.Player2TPId,
        p2.PlayerName AS Player2Name,
        cp2.CountryTPId AS Player2CountryTPId,
        cp2.CountryISO2 AS Player2CountryISO2,
        cp2.CountryISO3 AS Player2CountryISO3,
        cp2.CountryFull AS Player2CountryFull,
        ISNULL(LEFT(m.Result, 1) + ':' + RIGHT(m.Result, 1), '') AS Result,
        dbo.FormatResultDetails(m.ResultDetails) AS ResultDetails,
        m.Player1Odds,
        m.Player2Odds,
        te.Prize,
        FORMAT(m.WinProbabilityNN * 100.0, 'N2') AS WinProbabilityPlayer1NN,
        FORMAT((1.0 - m.WinProbabilityNN) * 100.0, 'N2') AS WinProbabilityPlayer2NN,
        FORMAT((m.Player1Odds - (1.0 / m.WinProbabilityNN)) * 100.0, 'N2') AS ValueMarginPlayer1,
        FORMAT((m.Player2Odds - (1.0 / (1.0 - m.WinProbabilityNN))) * 100.0, 'N2') AS ValueMarginPlayer2,
        CASE WHEN (m.Player1Odds - (1.0 / m.WinProbabilityNN)) > (m.Player2Odds - (1.0 / (1.0 - m.WinProbabilityNN))) AND (m.Player1Odds - (1.0 / m.WinProbabilityNN)) > 0 THEN '1' WHEN (m.Player2Odds - (1.0 / (1.0 - m.WinProbabilityNN))) > (m.Player1Odds - (1.0 / m.WinProbabilityNN)) AND (m.Player2Odds - (1.0 / (1.0 - m.WinProbabilityNN))) > 0 THEN '2' ELSE '0' END AS Who2Bet
    FROM Match m
    JOIN TournamentEvent te ON m.TournamentEventTPId = te.TournamentEventTPId
    JOIN Country ct ON te.CountryTPId = ct.CountryTPId
    JOIN Surface s ON te.SurfaceId = s.SurfaceId
    JOIN TournamentLevel tl ON te.TournamentLevelId = tl.TournamentLevelId
    JOIN TournamentType tt ON te.TournamentTypeId = tt.TournamentTypeId
    JOIN Player p1 ON m.Player1TPId = p1.PlayerTPId
    JOIN Player p2 ON m.Player2TPId = p2.PlayerTPId
    JOIN Country cp1 ON p1.CountryTPId = cp1.CountryTPId
    JOIN Country cp2 ON p2.CountryTPId = cp2.CountryTPId
    WHERE m.DateTime >= '2022-01-01' AND m.Result IN ('20', '21', '30', '31', '32')

    UNION ALL

    SELECT TOP 10000000
        m.MatchTPId,
        m.DateTime,
        m.TournamentEventTPId,
        te.CountryTPId,
        ct.CountryISO2,
        ct.CountryISO3,
        ct.CountryFull,
        dbo.RemoveRomanSuffix(te.TournamentEventName),
        te.SurfaceId,
        s.Surface,
        te.TournamentLevelId,
        CASE 
            WHEN te.TournamentLevelId = 1 THEN '> 50.000$'
            WHEN te.TournamentLevelId = 2 THEN 'Cup'
            WHEN te.TournamentLevelId = 3 THEN 'Qualifications'
            WHEN te.TournamentLevelId = 4 THEN '< 50.000$'
            ELSE ''
        END,
        te.TournamentTypeId,
        CASE 
            WHEN te.TournamentTypeId = 2 THEN 'ATP'
            WHEN te.TournamentTypeId = 4 THEN 'WTA'
            ELSE ''
        END,
        m.Player1TPId,
        p1.PlayerName,
        cp1.CountryTPId,
        cp1.CountryISO2,
        cp1.CountryISO3,
        cp1.CountryFull,
        m.Player2TPId,
        p2.PlayerName,
        cp2.CountryTPId,
        cp2.CountryISO2,
        cp2.CountryISO3,
        cp2.CountryFull,
        ISNULL(LEFT(m.Result, 1) + ':' + RIGHT(m.Result, 1), ''),
        dbo.FormatResultDetails(m.ResultDetails),
        m.Player1Odds,
        m.Player2Odds,
        te.Prize,
        m.WinProbabilityNN,
        FORMAT(m.WinProbabilityNN * 100.0, 'N2'),
        FORMAT((1.0 - m.WinProbabilityNN) * 100.0, 'N2'),
        FORMAT((m.Player1Odds - (1.0 / m.WinProbabilityNN)) * 100.0, 'N2'),
        FORMAT((m.Player2Odds - (1.0 / (1.0 - m.WinProbabilityNN))) * 100.0, 'N2'),
        CASE 
            WHEN (m.Player1Odds - (1.0 / m.WinProbabilityNN)) > (m.Player2Odds - (1.0 / (1.0 - m.WinProbabilityNN))) 
                 AND (m.Player1Odds - (1.0 / m.WinProbabilityNN)) > 0 THEN '1'
            WHEN (m.Player2Odds - (1.0 / (1.0 - m.WinProbabilityNN))) > (m.Player1Odds - (1.0 / m.WinProbabilityNN)) 
                 AND (m.Player2Odds - (1.0 / (1.0 - m.WinProbabilityNN))) > 0 THEN '2'
            ELSE '0'
        END
    FROM Match m
    JOIN TournamentEvent te ON m.TournamentEventTPId = te.TournamentEventTPId
    JOIN Country ct ON te.CountryTPId = ct.CountryTPId
    JOIN Surface s ON te.SurfaceId = s.SurfaceId
    JOIN TournamentLevel tl ON te.TournamentLevelId = tl.TournamentLevelId
    JOIN TournamentType tt ON te.TournamentTypeId = tt.TournamentTypeId
    JOIN Player p1 ON m.Player1TPId = p1.PlayerTPId
    JOIN Player p2 ON m.Player2TPId = p2.PlayerTPId
    JOIN Country cp1 ON p1.CountryTPId = cp1.CountryTPId
    JOIN Country cp2 ON p2.CountryTPId = cp2.CountryTPId
    WHERE m.DateTime >= '2022-01-01' AND m.Result IN ('20', '21', '30', '31', '32')
)
SELECT TOP 10000000
    MatchTPId,
    DateTime,
    TournamentEventTPId,
    TournamentEventCountryTPId,
    TournamentEventCountryISO2,
    TournamentEventCountryISO3,
    TournamentEventCountryFull,
    TournamentEventName,
    SurfaceId,
    Surface,
    TournamentLevelId,
    TournamentLevel,
    TournamentTypeId,
    TournamentType,
    Player1TPId,
    Player1CountryTPId,
    Player1CountryISO2,
    Player1CountryISO3,
    Player1CountryFull,
    Player1Name,
    Player2TPId,
    Player2CountryTPId,
    Player2CountryISO2,
    Player2CountryISO3,
    Player2CountryFull,
    Player2Name,
    Result,
    ResultDetails,
    Player1Odds,
    Player2Odds,
    Prize,
    WinProbabilityPlayer1NN,
    WinProbabilityPlayer2NN,
    ValueMarginPlayer1,
    ValueMarginPlayer2,
    Who2Bet
FROM TournamentMatches
ORDER BY PlayerTPId, DateTime ASC;
