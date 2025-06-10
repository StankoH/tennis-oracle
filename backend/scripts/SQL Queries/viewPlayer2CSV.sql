ALTER VIEW Player2CSV AS
WITH PlayerTSHistory AS (
    SELECT Player1TPId AS PlayerTPId, Player1TrueSkillMeanM AS TrueSkillMeanM, Player1TrueSkillMeanSM AS TrueSkillMeanSM, Player1TrueSkillMeanGSM AS TrueSkillMeanGSM FROM Match
    UNION ALL
    SELECT Player2TPId, Player2TrueSkillMeanM, Player2TrueSkillMeanSM, Player2TrueSkillMeanGSM FROM Match
),
PlayerTSCareerAvg AS (
    SELECT PlayerTPId, ROUND(AVG((TrueSkillMeanM + TrueSkillMeanSM + TrueSkillMeanGSM) / 3.0), 2) AS TSCareerAvg
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
PlayerLossStatsFromLastMatch AS (
    SELECT *
    FROM (
        SELECT
            PlayerTPId,
            TotalLossesAsFavourite,
            TotalLossesAsUnderdog,
            TotalLossesAsFavouriteLastYear,
            TotalLossesAsUnderdogLastYear,
            TotalLossesAsFavouriteLastMonth,
            TotalLossesAsUnderdogLastMonth,
            TotalLossesAsFavouriteLastWeek,
            TotalLossesAsUnderdogLastWeek,
            DateTime,
            ROW_NUMBER() OVER (PARTITION BY PlayerTPId ORDER BY DateTime DESC) AS rn
        FROM (
            SELECT
                m.Player1TPId AS PlayerTPId,
                m.Player1TotalLossesAsFavourite AS TotalLossesAsFavourite,
                m.Player1TotalLossesAsUnderdog AS TotalLossesAsUnderdog,
                m.Player1TotalLossesAsFavouriteLastYear AS TotalLossesAsFavouriteLastYear,
                m.Player1TotalLossesAsUnderdogLastYear AS TotalLossesAsUnderdogLastYear,
                m.Player1TotalLossesAsFavouriteLastMonth AS TotalLossesAsFavouriteLastMonth,
                m.Player1TotalLossesAsUnderdogLastMonth AS TotalLossesAsUnderdogLastMonth,
                m.Player1TotalLossesAsFavouriteLastWeek AS TotalLossesAsFavouriteLastWeek,
                m.Player1TotalLossesAsUnderdogLastWeek AS TotalLossesAsUnderdogLastWeek,
                m.DateTime
            FROM Match m
            WHERE m.Player1Odds IS NOT NULL AND m.Player2Odds IS NOT NULL AND m.Player1Odds != m.Player2Odds

            UNION ALL

            SELECT
                m.Player2TPId AS PlayerTPId,
                m.Player2TotalLossesAsFavourite AS TotalLossesAsFavourite,
                m.Player2TotalLossesAsUnderdog AS TotalLossesAsUnderdog,
                m.Player2TotalLossesAsFavouriteLastYear AS TotalLossesAsFavouriteLastYear,
                m.Player2TotalLossesAsUnderdogLastYear AS TotalLossesAsUnderdogLastYear,
                m.Player2TotalLossesAsFavouriteLastMonth AS TotalLossesAsFavouriteLastMonth,
                m.Player2TotalLossesAsUnderdogLastMonth AS TotalLossesAsUnderdogLastMonth,
                m.Player2TotalLossesAsFavouriteLastWeek AS TotalLossesAsFavouriteLastWeek,
                m.Player2TotalLossesAsUnderdogLastWeek AS TotalLossesAsUnderdogLastWeek,
                m.DateTime
            FROM Match m
            WHERE m.Player1Odds IS NOT NULL AND m.Player2Odds IS NOT NULL AND m.Player1Odds != m.Player2Odds
        ) AS unified
    ) AS ranked
    WHERE rn = 1
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
        '"playerHeight"' AS playerHeight,
        '"playerWeight"' AS playerWeight,
        '"playerTurnedPro"' AS playerTurnedPro,
        '"playsId"' AS playsId,
        '"plays"' AS plays,
		'"playerTournamentTypeId"' AS playerTournamentTypeId,
		'"playerTournamentType"' AS playerTournamentType,
		'"winRatio"' AS winRatio,
        '"matches"' AS matches,
        '"trueSkillMean"' AS trueSkillMean,
        '"careerTrueSkillMean"' AS careerTrueSkillMean,
        '"trueSkillMeanM"' AS trueSkillMeanM,
        '"trueSkillStandardDeviationM"' AS trueSkillStandardDeviationM,
        '"trueSkillMeanSM"' AS trueSkillMeanSM,
        '"trueSkillStandardDeviationSM"' AS trueSkillStandardDeviationSM,
        '"trueSkillMeanGSM"' AS trueSkillMeanGSM,
        '"trueSkillStandardDeviationGSM"' AS trueSkillStandardDeviationGSM,
        '"trueSkillMeanMS1"' AS trueSkillMeanMS1,
        '"trueSkillStandardDeviationMS1"' AS trueSkillStandardDeviationMS1,
        '"TrueSkillMeanSMS1"' AS TrueSkillMeanSMS1,
        '"trueSkillStandardDeviationSMS1"' AS trueSkillStandardDeviationSMS1,
        '"TrueSkillMeanGSMS1"' AS TrueSkillMeanGSMS1,
        '"trueSkillStandardDeviationGSMS1"' AS trueSkillStandardDeviationGSMS1,
        '"TrueSkillMeanMS2"' AS TrueSkillMeanMS2,
        '"trueSkillStandardDeviationMS2"' AS trueSkillStandardDeviationMS2,
        '"TrueSkillMeanSMS2"' AS TrueSkillMeanSMS2,
        '"trueSkillStandardDeviationSMS2"' AS trueSkillStandardDeviationSMS2,
        '"TrueSkillMeanGSMS2"' AS TrueSkillMeanGSMS2,
        '"trueSkillStandardDeviationGSMS2"' AS trueSkillStandardDeviationGSMS2,
        '"TrueSkillMeanMS3"' AS TrueSkillMeanMS3,
        '"trueSkillStandardDeviationMS3"' AS trueSkillStandardDeviationMS3,
        '"TrueSkillMeanSMS3"' AS TrueSkillMeanSMS3,
        '"trueSkillStandardDeviationSMS3"' AS trueSkillStandardDeviationSMS3,
        '"TrueSkillMeanGSMS3"' AS TrueSkillMeanGSMS3,
        '"trueSkillStandardDeviationGSMS3"' AS trueSkillStandardDeviationGSMS3,
        '"TrueSkillMeanMS4"' AS TrueSkillMeanMS4,
        '"trueSkillStandardDeviationMS4"' AS trueSkillStandardDeviationMS4,
        '"TrueSkillMeanSMS4"' AS TrueSkillMeanSMS4,
        '"trueSkillStandardDeviationSMS4"' AS trueSkillStandardDeviationSMS4,
        '"TrueSkillMeanGSMS4"' AS TrueSkillMeanGSMS4,
        '"trueSkillStandardDeviationGSMS4"' AS trueSkillStandardDeviationGSMS4,
        '"matchesTotal"' AS matchesTotal,
        '"matchesWinRatio"' AS matchesWinRatio,
        '"matchesLossRatio"' AS matchesLossRatio,
        '"winsTotal"' AS winsTotal,
        '"lossesTotal"' AS lossesTotal,
        '"matchesLastYear"' AS matchesLastYear,
        '"matchesLastYearWinRatio"' AS matchesLastYearWinRatio,
        '"matchesLastYearLossRatio"' AS matchesLastYearLossRatio,
        '"winsLastYear"' AS winsLastYear,
        '"lossesLastYear"' AS lossesLastYear,
        '"matchesLastMonth"' AS matchesLastMonth,
        '"matchesLastMonthWinRatio"' AS matchesLastMonthWinRatio,
        '"matchesLastMonthLossRatio"' AS matchesLastMonthLossRatio,
        '"winsLastMonth"' AS winsLastMonth,
        '"lossesLastMonth"' AS lossesLastMonth,
        '"matchesLastWeek"' AS matchesLastWeek,
        '"matchesLastWeekWinRatio"' AS matchesLastWeekWinRatio,
        '"matchesLastWeekLossRatio"' AS matchesLastWeekLossRatio,
        '"winsLastWeek"' AS winsLastWeek,
        '"lossesLastWeek"' AS lossesLastWeek,
        '"matchesTotalS1"' AS matchesTotalS1,
        '"matchesTotalS1WinRatio"' AS matchesTotalS1WinRatio,
        '"matchesTotalS1LossRatio"' AS matchesTotalS1LossRatio,
        '"winsTotalS1"' AS winsTotalS1,
        '"lossesTotalS1"' AS lossesTotalS1,
        '"matchesLastYearS1"' AS matchesLastYearS1,
        '"matchesLastYearS1WinRatio"' AS matchesLastYearS1WinRatio,
        '"matchesLastYearS1LossRatio"' AS matchesLastYearS1LossRatio,
        '"winsLastYearS1"' AS winsLastYearS1,
        '"lossesLastYearS1"' AS lossesLastYearS1,
        '"matchesLastMonthS1"' AS matchesLastMonthS1,
        '"matchesLastMonthS1WinRatio"' AS matchesLastMonthS1WinRatio,
        '"matchesLastMonthS1LossRatio"' AS matchesLastMonthS1LossRatio,
        '"winsLastMonthS1"' AS winsLastMonthS1,
        '"lossesLastMonthS1"' AS lossesLastMonthS1,
        '"matchesLastWeekS1"' AS matchesLastWeekS1,
        '"matchesLastWeekS1WinRatio"' AS matchesLastWeekS1WinRatio,
        '"matchesLastWeekS1LossRatio"' AS matchesLastWeekS1LossRatio,
        '"winsLastWeekS1"' AS winsLastWeekS1,
        '"lossesLastWeekS1"' AS lossesLastWeekS1,
        '"matchesTotalS2"' AS matchesTotalS2,
        '"matchesTotalS2WinRatio"' AS matchesTotalS2WinRatio,
        '"matchesTotalS2LossRatio"' AS matchesTotalS2LossRatio,
        '"winsTotalS2"' AS winsTotalS2,
        '"lossesTotalS2"' AS lossesTotalS2,
        '"matchesLastYearS2"' AS matchesLastYearS2,
        '"matchesLastYearS2WinRatio"' AS matchesLastYearS2WinRatio,
        '"matchesLastYearS2LossRatio"' AS matchesLastYearS2LossRatio,
        '"winsLastYearS2"' AS winsLastYearS2,
        '"lossesLastYearS2"' AS lossesLastYearS2,
        '"matchesLastMonthS2"' AS matchesLastMonthS2,
        '"matchesLastMonthS2WinRatio"' AS matchesLastMonthS2WinRatio,
        '"matchesLastMonthS2LossRatio"' AS matchesLastMonthS2LossRatio,
        '"winsLastMonthS2"' AS winsLastMonthS2,
        '"lossesLastMonthS2"' AS lossesLastMonthS2,
        '"matchesLastWeekS2"' AS matchesLastWeekS2,
        '"matchesLastWeekS2WinRatio"' AS matchesLastWeekS2WinRatio,
        '"matchesLastWeekS2LossRatio"' AS matchesLastWeekS2LossRatio,
        '"winsLastWeekS2"' AS winsLastWeekS2,
        '"lossesLastWeekS2"' AS lossesLastWeekS2,
        '"matchesTotalS3"' AS matchesTotalS3,
        '"matchesTotalS3WinRatio"' AS matchesTotalS3WinRatio,
        '"matchesTotalS3LossRatio"' AS matchesTotalS3LossRatio,
        '"winsTotalS3"' AS winsTotalS3,
        '"lossesTotalS3"' AS lossesTotalS3,
        '"matchesLastYearS3"' AS matchesLastYearS3,
        '"matchesLastYearS3WinRatio"' AS matchesLastYearS3WinRatio,
        '"matchesLastYearS3LossRatio"' AS matchesLastYearS3LossRatio,
        '"winsLastYearS3"' AS winsLastYearS3,
        '"lossesLastYearS3"' AS lossesLastYearS3,
        '"matchesLastMonthS3"' AS matchesLastMonthS3,
        '"matchesLastMonthS3WinRatio"' AS matchesLastMonthS3WinRatio,
        '"matchesLastMonthS3LossRatio"' AS matchesLastMonthS3LossRatio,
        '"winsLastMonthS3"' AS winsLastMonthS3,
        '"lossesLastMonthS3"' AS lossesLastMonthS3,
        '"matchesLastWeekS3"' AS matchesLastWeekS3,
        '"matchesLastWeekS3WinRatio"' AS matchesLastWeekS3WinRatio,
        '"matchesLastWeekS3LossRatio"' AS matchesLastWeekS3LossRatio,
        '"winsLastWeekS3"' AS winsLastWeekS3,
        '"lossesLastWeekS3"' AS lossesLastWeekS3,
        '"matchesTotalS4"' AS matchesTotalS4,
        '"matchesTotalS4WinRatio"' AS matchesTotalS4WinRatio,
        '"matchesTotalS4LossRatio"' AS matchesTotalS4LossRatio,
        '"winsTotalS4"' AS winsTotalS4,
        '"lossesTotalS4"' AS lossesTotalS4,
        '"matchesLastYearS4"' AS matchesLastYearS4,
        '"matchesLastYearS4WinRatio"' AS matchesLastYearS4WinRatio,
        '"matchesLastYearS4LossRatio"' AS matchesLastYearS4LossRatio,
        '"winsLastYearS4"' AS winsLastYearS4,
        '"lossesLastYearS4"' AS lossesLastYearS4,
        '"matchesLastMonthS4"' AS matchesLastMonthS4,
        '"matchesLastMonthS4WinRatio"' AS matchesLastMonthS4WinRatio,
        '"matchesLastMonthS4LossRatio"' AS matchesLastMonthS4LossRatio,
        '"winsLastMonthS4"' AS winsLastMonthS4,
        '"lossesLastMonthS4"' AS lossesLastMonthS4,
        '"matchesLastWeekS4"' AS matchesLastWeekS4,
        '"matchesLastWeekS4WinRatio"' AS matchesLastWeekS4WinRatio,
        '"matchesLastWeekS4LossRatio"' AS matchesLastWeekS4LossRatio,
        '"winsLastWeekS4"' AS winsLastWeekS4,
        '"lossesLastWeekS4"' AS lossesLastWeekS4,
        '"setsTotal"' AS setsTotal,
        '"setsWinRatio"' AS setsWinRatio,
        '"setsLossRatio"' AS setsLossRatio,
        '"winsSetsTotal"' AS winsSetsTotal,
        '"lossesSetsTotal"' AS lossesSetsTotal,
        '"setsLastYear"' AS setsLastYear,
        '"setsLastYearWinRatio"' AS setsLastYearWinRatio,
        '"setsLastYearLossRatio"' AS setsLastYearLossRatio,
        '"winsSetsLastYear"' AS winsSetsLastYear,
        '"lossesSetsLastYear"' AS lossesSetsLastYear,
        '"setsLastMonth"' AS setsLastMonth,
        '"setsLastMonthWinRatio"' AS setsLastMonthWinRatio,
        '"setsLastMonthLossRatio"' AS setsLastMonthLossRatio,
        '"winsSetsLastMonth"' AS winsSetsLastMonth,
        '"lossesSetsLastMonth"' AS lossesSetsLastMonth,
        '"setsLastWeek"' AS setsLastWeek,
        '"setsLastWeekWinRatio"' AS setsLastWeekWinRatio,
        '"setsLastWeekLossRatio"' AS setsLastWeekLossRatio,
        '"winsSetsLastWeek"' AS winsSetsLastWeek,
        '"lossesSetsLastWeek"' AS lossesSetsLastWeek,
        '"setsTotalS1"' AS setsTotalS1,
        '"setsTotalS1WinRatio"' AS setsTotalS1WinRatio,
        '"setsTotalS1LossRatio"' AS setsTotalS1LossRatio,
        '"winsSetsTotalS1"' AS winsSetsTotalS1,
        '"lossesSetsTotalS1"' AS lossesSetsTotalS1,
        '"setsLastYearS1"' AS setsLastYearS1,
        '"setsLastYearS1WinRatio"' AS setsLastYearS1WinRatio,
        '"setsLastYearS1LossRatio"' AS setsLastYearS1LossRatio,
        '"winsSetsLastYearS1"' AS winsSetsLastYearS1,
        '"lossesSetsLastYearS1"' AS lossesSetsLastYearS1,
        '"setsLastMonthS1"' AS setsLastMonthS1,
        '"setsLastMonthS1WinRatio"' AS setsLastMonthS1WinRatio,
        '"setsLastMonthS1LossRatio"' AS setsLastMonthS1LossRatio,
        '"winsSetsLastMonthS1"' AS winsSetsLastMonthS1,
        '"lossesSetsLastMonthS1"' AS lossesSetsLastMonthS1,
        '"setsLastWeekS1"' AS setsLastWeekS1,
        '"setsLastWeekS1WinRatio"' AS setsLastWeekS1WinRatio,
        '"setsLastWeekS1LossRatio"' AS setsLastWeekS1LossRatio,
        '"winsSetsLastWeekS1"' AS winsSetsLastWeekS1,
        '"lossesSetsLastWeekS1"' AS lossesSetsLastWeekS1,
        '"setsTotalS2"' AS setsTotalS2,
        '"setsTotalS2WinRatio"' AS setsTotalS2WinRatio,
        '"setsTotalS2LossRatio"' AS setsTotalS2LossRatio,
        '"winsSetsTotalS2"' AS winsSetsTotalS2,
        '"lossesSetsTotalS2"' AS lossesSetsTotalS2,
        '"setsLastYearS2"' AS setsLastYearS2,
        '"setsLastYearS2WinRatio"' AS setsLastYearS2WinRatio,
        '"setsLastYearS2LossRatio"' AS setsLastYearS2LossRatio,
        '"winsSetsLastYearS2"' AS winsSetsLastYearS2,
        '"lossesSetsLastYearS2"' AS lossesSetsLastYearS2,
        '"setsLastMonthS2"' AS setsLastMonthS2,
        '"setsLastMonthS2WinRatio"' AS setsLastMonthS2WinRatio,
        '"setsLastMonthS2LossRatio"' AS setsLastMonthS2LossRatio,
        '"winsSetsLastMonthS2"' AS winsSetsLastMonthS2,
        '"lossesSetsLastMonthS2"' AS lossesSetsLastMonthS2,
        '"setsLastWeekS2"' AS setsLastWeekS2,
        '"setsLastWeekS2WinRatio"' AS setsLastWeekS2WinRatio,
        '"setsLastWeekS2LossRatio"' AS setsLastWeekS2LossRatio,
        '"winsSetsLastWeekS2"' AS winsSetsLastWeekS2,
        '"lossesSetsLastWeekS2"' AS lossesSetsLastWeekS2,
        '"setsTotalS3"' AS setsTotalS3,
        '"setsTotalS3WinRatio"' AS setsTotalS3WinRatio,
        '"setsTotalS3LossRatio"' AS setsTotalS3LossRatio,
        '"winsSetsTotalS3"' AS winsSetsTotalS3,
        '"lossesSetsTotalS3"' AS lossesSetsTotalS3,
        '"setsLastYearS3"' AS setsLastYearS3,
        '"setsLastYearS3WinRatio"' AS setsLastYearS3WinRatio,
        '"setsLastYearS3LossRatio"' AS setsLastYearS3LossRatio,
        '"winsSetsLastYearS3"' AS winsSetsLastYearS3,
        '"lossesSetsLastYearS3"' AS lossesSetsLastYearS3,
        '"setsLastMonthS3"' AS setsLastMonthS3,
        '"setsLastMonthS3WinRatio"' AS setsLastMonthS3WinRatio,
        '"setsLastMonthS3LossRatio"' AS setsLastMonthS3LossRatio,
        '"winsSetsLastMonthS3"' AS winsSetsLastMonthS3,
        '"lossesSetsLastMonthS3"' AS lossesSetsLastMonthS3,
        '"setsLastWeekS3"' AS setsLastWeekS3,
        '"setsLastWeekS3WinRatio"' AS setsLastWeekS3WinRatio,
        '"setsLastWeekS3LossRatio"' AS setsLastWeekS3LossRatio,
        '"winsSetsLastWeekS3"' AS winsSetsLastWeekS3,
        '"lossesSetsLastWeekS3"' AS lossesSetsLastWeekS3,
        '"setsTotalS4"' AS setsTotalS4,
        '"setsTotalS4WinRatio"' AS setsTotalS4WinRatio,
        '"setsTotalS4LossRatio"' AS setsTotalS4LossRatio,
        '"winsSetsTotalS4"' AS winsSetsTotalS4,
        '"lossesSetsTotalS4"' AS lossesSetsTotalS4,
        '"setsLastYearS4"' AS setsLastYearS4,
        '"setsLastYearS4WinRatio"' AS setsLastYearS4WinRatio,
        '"setsLastYearS4LossRatio"' AS setsLastYearS4LossRatio,
        '"winsSetsLastYearS4"' AS winsSetsLastYearS4,
        '"lossesSetsLastYearS4"' AS lossesSetsLastYearS4,
        '"setsLastMonthS4"' AS setsLastMonthS4,
        '"setsLastMonthS4WinRatio"' AS setsLastMonthS4WinRatio,
        '"setsLastMonthS4LossRatio"' AS setsLastMonthS4LossRatio,
        '"winsSetsLastMonthS4"' AS winsSetsLastMonthS4,
        '"lossesSetsLastMonthS4"' AS lossesSetsLastMonthS4,
        '"setsLastWeekS4"' AS setsLastWeekS4,
        '"setsLastWeekS4WinRatio"' AS setsLastWeekS4WinRatio,
        '"setsLastWeekS4LossRatio"' AS setsLastWeekS4LossRatio,
        '"winsSetsLastWeekS4"' AS winsSetsLastWeekS4,
        '"lossesSetsLastWeekS4"' AS lossesSetsLastWeekS4,
        '"gamesTotal"' AS gamesTotal,
        '"gamesWinRatio"' AS gamesWinRatio,
        '"gamesLossRatio"' AS gamesLossRatio,
        '"winsGamesTotal"' AS winsGamesTotal,
        '"lossesGamesTotal"' AS lossesGamesTotal,
        '"gamesLastYear"' AS gamesLastYear,
        '"gamesLastYearWinRatio"' AS gamesLastYearWinRatio,
        '"gamesLastYearLossRatio"' AS gamesLastYearLossRatio,
        '"winsGamesLastYear"' AS winsGamesLastYear,
        '"lossesGamesLastYear"' AS lossesGamesLastYear,
        '"gamesLastMonth"' AS gamesLastMonth,
        '"gamesLastMonthWinRatio"' AS gamesLastMonthWinRatio,
        '"gamesLastMonthLossRatio"' AS gamesLastMonthLossRatio,
        '"winsGamesLastMonth"' AS winsGamesLastMonth,
        '"lossesGamesLastMonth"' AS lossesGamesLastMonth,
        '"gamesLastWeek"' AS gamesLastWeek,
        '"gamesLastWeekWinRatio"' AS gamesLastWeekWinRatio,
        '"gamesLastWeekLossRatio"' AS gamesLastWeekLossRatio,
        '"winsGamesLastWeek"' AS winsGamesLastWeek,
        '"lossesGamesLastWeek"' AS lossesGamesLastWeek,
        '"gamesTotalS1"' AS gamesTotalS1,
        '"gamesTotalS1WinRatio"' AS gamesTotalS1WinRatio,
        '"gamesTotalS1LossRatio"' AS gamesTotalS1LossRatio,
        '"winsGamesTotalS1"' AS winsGamesTotalS1,
        '"lossesGamesTotalS1"' AS lossesGamesTotalS1,
        '"gamesLastYearS1"' AS gamesLastYearS1,
        '"gamesLastYearS1WinRatio"' AS gamesLastYearS1WinRatio,
        '"gamesLastYearS1LossRatio"' AS gamesLastYearS1LossRatio,
        '"winsGamesLastYearS1"' AS winsGamesLastYearS1,
        '"lossesGamesLastYearS1"' AS lossesGamesLastYearS1,
        '"gamesLastMonthS1"' AS gamesLastMonthS1,
        '"gamesLastMonthS1WinRatio"' AS gamesLastMonthS1WinRatio,
        '"gamesLastMonthS1LossRatio"' AS gamesLastMonthS1LossRatio,
        '"winsGamesLastMonthS1"' AS winsGamesLastMonthS1,
        '"lossesGamesLastMonthS1"' AS lossesGamesLastMonthS1,
        '"gamesLastWeekS1"' AS gamesLastWeekS1,
        '"gamesLastWeekS1WinRatio"' AS gamesLastWeekS1WinRatio,
        '"gamesLastWeekS1LossRatio"' AS gamesLastWeekS1LossRatio,
        '"winsGamesLastWeekS1"' AS winsGamesLastWeekS1,
        '"lossesGamesLastWeekS1"' AS lossesGamesLastWeekS1,
        '"gamesTotalS2"' AS gamesTotalS2,
        '"gamesTotalS2WinRatio"' AS gamesTotalS2WinRatio,
        '"gamesTotalS2LossRatio"' AS gamesTotalS2LossRatio,
        '"winsGamesTotalS2"' AS winsGamesTotalS2,
        '"lossesGamesTotalS2"' AS lossesGamesTotalS2,
        '"gamesLastYearS2"' AS gamesLastYearS2,
        '"gamesLastYearS2WinRatio"' AS gamesLastYearS2WinRatio,
        '"gamesLastYearS2LossRatio"' AS gamesLastYearS2LossRatio,
        '"winsGamesLastYearS2"' AS winsGamesLastYearS2,
        '"lossesGamesLastYearS2"' AS lossesGamesLastYearS2,
        '"gamesLastMonthS2"' AS gamesLastMonthS2,
        '"gamesLastMonthS2WinRatio"' AS gamesLastMonthS2WinRatio,
        '"gamesLastMonthS2LossRatio"' AS gamesLastMonthS2LossRatio,
        '"winsGamesLastMonthS2"' AS winsGamesLastMonthS2,
        '"lossesGamesLastMonthS2"' AS lossesGamesLastMonthS2,
        '"gamesLastWeekS2"' AS gamesLastWeekS2,
        '"gamesLastWeekS2WinRatio"' AS gamesLastWeekS2WinRatio,
        '"gamesLastWeekS2LossRatio"' AS gamesLastWeekS2LossRatio,
        '"winsGamesLastWeekS2"' AS winsGamesLastWeekS2,
        '"lossesGamesLastWeekS2"' AS lossesGamesLastWeekS2,
        '"gamesTotalS3"' AS gamesTotalS3,
        '"gamesTotalS3WinRatio"' AS gamesTotalS3WinRatio,
        '"gamesTotalS3LossRatio"' AS gamesTotalS3LossRatio,
        '"winsGamesTotalS3"' AS winsGamesTotalS3,
        '"lossesGamesTotalS3"' AS lossesGamesTotalS3,
        '"gamesLastYearS3"' AS gamesLastYearS3,
        '"gamesLastYearS3WinRatio"' AS gamesLastYearS3WinRatio,
        '"gamesLastYearS3LossRatio"' AS gamesLastYearS3LossRatio,
        '"winsGamesLastYearS3"' AS winsGamesLastYearS3,
        '"lossesGamesLastYearS3"' AS lossesGamesLastYearS3,
        '"gamesLastMonthS3"' AS gamesLastMonthS3,
        '"gamesLastMonthS3WinRatio"' AS gamesLastMonthS3WinRatio,
        '"gamesLastMonthS3LossRatio"' AS gamesLastMonthS3LossRatio,
        '"winsGamesLastMonthS3"' AS winsGamesLastMonthS3,
        '"lossesGamesLastMonthS3"' AS lossesGamesLastMonthS3,
        '"gamesLastWeekS3"' AS gamesLastWeekS3,
        '"gamesLastWeekS3WinRatio"' AS gamesLastWeekS3WinRatio,
        '"gamesLastWeekS3LossRatio"' AS gamesLastWeekS3LossRatio,
        '"winsGamesLastWeekS3"' AS winsGamesLastWeekS3,
        '"lossesGamesLastWeekS3"' AS lossesGamesLastWeekS3,
        '"gamesTotalS4"' AS gamesTotalS4,
        '"gamesTotalS4WinRatio"' AS gamesTotalS4WinRatio,
        '"gamesTotalS4LossRatio"' AS gamesTotalS4LossRatio,
        '"winsGamesTotalS4"' AS winsGamesTotalS4,
        '"lossesGamesTotalS4"' AS lossesGamesTotalS4,
        '"gamesLastYearS4"' AS gamesLastYearS4,
        '"gamesLastYearS4WinRatio"' AS gamesLastYearS4WinRatio,
        '"gamesLastYearS4LossRatio"' AS gamesLastYearS4LossRatio,
        '"winsGamesLastYearS4"' AS winsGamesLastYearS4,
        '"lossesGamesLastYearS4"' AS lossesGamesLastYearS4,
        '"gamesLastMonthS4"' AS gamesLastMonthS4,
        '"gamesLastMonthS4WinRatio"' AS gamesLastMonthS4WinRatio,
        '"gamesLastMonthS4LossRatio"' AS gamesLastMonthS4LossRatio,
        '"winsGamesLastMonthS4"' AS winsGamesLastMonthS4,
        '"lossesGamesLastMonthS4"' AS lossesGamesLastMonthS4,
        '"gamesLastWeekS4"' AS gamesLastWeekS4,
        '"gamesLastWeekS4WinRatio"' AS gamesLastWeekS4WinRatio,
        '"gamesLastWeekS4LossRatio"' AS gamesLastWeekS4LossRatio,
        '"winsGamesLastWeekS4"' AS winsGamesLastWeekS4,
        '"lossesGamesLastWeekS4"' AS lossesGamesLastWeekS4,
        '"dateSinceLastWin"' AS dateSinceLastWin,
        '"dateSinceLastWinS1"' AS dateSinceLastWinS1,
        '"dateSinceLastWinS2"' AS dateSinceLastWinS2,
        '"dateSinceLastWinS3"' AS dateSinceLastWinS3,
        '"dateSinceLastWinS4"' AS dateSinceLastWinS4,
        '"dateSinceLastLoss"' AS dateSinceLastLoss,
        '"dateSinceLastLossS1"' AS dateSinceLastLossS1,
        '"dateSinceLastLossS2"' AS dateSinceLastLossS2,
        '"dateSinceLastLossS3"' AS dateSinceLastLossS3,
        '"dateSinceLastLossS4"' AS dateSinceLastLossS4,
        '"totalWinsAsFavourite"' AS totalWinsAsFavourite,
        '"totalWinsAsUnderdog"' AS totalWinsAsUnderdog,
        '"TotalLossesAsFavourite"' AS TotalLossesAsFavourite,
        '"TotalLossesAsUnderdog"' AS TotalLossesAsUnderdog,
        '"winsAsFavouriteRatio"' AS winsAsFavouriteRatio,
        '"lossesAsFavouriteRatio"' AS lossesAsFavouriteRatio,
        '"winsAsUnderdogRatio"' AS winsAsUnderdogRatio,
        '"lossesAsUnderdogRatio"' AS lossesAsUnderdogRatio,
        '"averageWinningProbabilityAtWonAsFavourite"' AS averageWinningProbabilityAtWonAsFavourite,
        '"averageWinningProbabilityAtWonAsUnderdog"' AS averageWinningProbabilityAtWonAsUnderdog,
        '"averageWinningProbabilityAtLossAsFavourite"' AS averageWinningProbabilityAtLossAsFavourite,
        '"averageWinningProbabilityAtLossAsUnderdog"' AS averageWinningProbabilityAtLossAsUnderdog,
        '"totalWinsAsFavouriteLastYear"' AS totalWinsAsFavouriteLastYear,
        '"totalWinsAsUnderdogLastYear"' AS totalWinsAsUnderdogLastYear,
        '"TotalLossesAsFavouriteLastYear"' AS TotalLossesAsFavouriteLastYear,
        '"TotalLossesAsUnderdogLastYear"' AS TotalLossesAsUnderdogLastYear,
        '"winsAsFavouriteLastYearRatio"' AS winsAsFavouriteLastYearRatio,
        '"lossesAsFavouriteLastYearRatio"' AS lossesAsFavouriteLastYearRatio,
        '"winsAsUnderdogLastYearRatio"' AS winsAsUnderdogLastYearRatio,
        '"lossesAsUnderdogLastYearRatio"' AS lossesAsUnderdogLastYearRatio,
        '"averageWinningProbabilityAtWonAsFavouriteLastYear"' AS averageWinningProbabilityAtWonAsFavouriteLastYear,
        '"averageWinningProbabilityAtWonAsUnderdogLastYear"' AS averageWinningProbabilityAtWonAsUnderdogLastYear,
        '"averageWinningProbabilityAtLossAsFavouriteLastYear"' AS averageWinningProbabilityAtLossAsFavouriteLastYear,
        '"averageWinningProbabilityAtLossAsUnderdogLastYear"' AS averageWinningProbabilityAtLossAsUnderdogLastYear,
        '"totalWinsAsFavouriteLastMonth"' AS totalWinsAsFavouriteLastMonth,
        '"totalWinsAsUnderdogLastMonth"' AS totalWinsAsUnderdogLastMonth,
        '"TotalLossesAsFavouriteLastMonth"' AS TotalLossesAsFavouriteLastMonth,
        '"TotalLossesAsUnderdogLastMonth"' AS TotalLossesAsUnderdogLastMonth,
        '"winsAsFavouriteLastMonthRatio"' AS winsAsFavouriteLastMonthRatio,
        '"lossesAsFavouriteLastMonthRatio"' AS lossesAsFavouriteLastMonthRatio,
        '"winsAsUnderdogLastMonthRatio"' AS winsAsUnderdogLastMonthRatio,
        '"lossesAsUnderdogLastMonthRatio"' AS lossesAsUnderdogLastMonthRatio,
        '"averageWinningProbabilityAtWonAsFavouriteLastMonth"' AS averageWinningProbabilityAtWonAsFavouriteLastMonth,
        '"averageWinningProbabilityAtWonAsUnderdogLastMonth"' AS averageWinningProbabilityAtWonAsUnderdogLastMonth,
        '"averageWinningProbabilityAtLossAsFavouriteLastMonth"' AS averageWinningProbabilityAtLossAsFavouriteLastMonth,
        '"averageWinningProbabilityAtLossAsUnderdogLastMonth"' AS averageWinningProbabilityAtLossAsUnderdogLastMonth,
        '"totalWinsAsFavouriteLastWeek"' AS totalWinsAsFavouriteLastWeek,
        '"totalWinsAsUnderdogLastWeek"' AS totalWinsAsUnderdogLastWeek,
        '"TotalLossesAsFavouriteLastWeek"' AS TotalLossesAsFavouriteLastWeek,
        '"TotalLossesAsUnderdogLastWeek"' AS TotalLossesAsUnderdogLastWeek,
        '"winsAsFavouriteLastWeekRatio"' AS winsAsFavouriteLastWeekRatio,
        '"lossesAsFavouriteLastWeekRatio"' AS lossesAsFavouriteLastWeekRatio,
        '"winsAsUnderdogLastWeekRatio"' AS winsAsUnderdogLastWeekRatio,
        '"lossesAsUnderdogLastWeekRatio"' AS lossesAsUnderdogLastWeekRatio,
        '"averageWinningProbabilityAtWonAsFavouriteLastWeek"' AS averageWinningProbabilityAtWonAsFavouriteLastWeek,
        '"averageWinningProbabilityAtWonAsUnderdogLastWeek"' AS averageWinningProbabilityAtWonAsUnderdogLastWeek,
        '"averageWinningProbabilityAtLossAsFavouriteLastWeek"' AS averageWinningProbabilityAtLossAsFavouriteLastWeek,
        '"averageWinningProbabilityAtLossAsUnderdogLastWeek"' AS averageWinningProbabilityAtLossAsUnderdogLastWeek,
        '"streak"' AS streak,
        '"streakS1"' AS streakS1,
        '"streakS2"' AS streakS2,
        '"streakS3"' AS streakS3,
        '"streakS4"' AS streakS4
    UNION ALL

    SELECT CAST(2 AS INT) AS RowNum,
       '"' + ISNULL(CAST(p.PlayerTPId AS varchar), '') + '"',
        '"' + REPLACE(ISNULL(p.PlayerName, ''), '&#39;', '''') + '"',
        '"' + ISNULL(CAST(p.CountryTPId AS varchar), '') + '"',
        '"' + ISNULL(c.CountryISO2, '') + '"',
        '"' + ISNULL(c.CountryISO3, '') + '"',
        '"' + REPLACE(ISNULL(c.CountryFull, ''), '&#39;', '''') + '"',
        '"' + ISNULL(CONVERT(varchar, p.PlayerBirthDate, 23), '') + '"',
        '"' + ISNULL(CAST(p.PlayerHeight AS varchar), '') + '"',
        '"' + ISNULL(CAST(p.PlayerWeight AS varchar), '') + '"',
        '"' + ISNULL(CAST(p.PlayerTurnedPro AS varchar), '') + '"',
        '"' + ISNULL(CAST(p.PlaysId AS varchar), '') + '"',
        '"' + ISNULL(ps.Plays, '') + '"',
		'"' + ISNULL(CAST(fptt.TournamentTypeId AS varchar), '') + '"',
		'"' + ISNULL(tt.TournamentType, '') + '"',
		'"' + ISNULL(LTRIM(REPLACE(STR(CASE WHEN (p.WinsTotal + p.LossesTotal) > 0 THEN (CAST(p.WinsTotal AS FLOAT) / (p.WinsTotal + p.LossesTotal)) * 100 ELSE NULL END, 10, 2), ',', '.')), '') + '"',
		'"' + ISNULL(CAST(p.WinsTotal + p.LossesTotal AS varchar), '') + '"',
		'"' + ISNULL(LTRIM(REPLACE(STR(ROUND((CAST(p.TrueSkillMeanM AS FLOAT) + CAST(p.TrueSkillMeanSM AS FLOAT) + CAST(p.TrueSkillMeanGSM AS FLOAT)) / 3.0, 2), 10, 2), ',', '.')), '') + '"',
		'"' + ISNULL(LTRIM(REPLACE(STR(tsavg.TSCareerAvg, 10, 2), ',', '.')), '') + '"'
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillMeanM, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillMeanM
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillStandardDeviationM, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillStandardDeviationM
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillMeanSM, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillMeanSM
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillStandardDeviationSM, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillStandardDeviationSM
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillMeanGSM, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillMeanGSM
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillStandardDeviationGSM, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillStandardDeviationGSM
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillMeanMS1, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillMeanMS1
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillStandardDeviationMS1, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillStandardDeviationMS1
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillMeanSMS1, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillMeanSMS1
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillStandardDeviationSMS1, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillStandardDeviationSMS1
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillMeanGSMS1, 10, 2), ',', '.')) AS varchar) + '"' AS TrueSkillMeanGSMS1
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillStandardDeviationGSMS1, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillStandardDeviationGSMS1
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillMeanMS2, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillMeanMS2
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillStandardDeviationMS2, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillStandardDeviationMS2
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillMeanSMS2, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillMeanSMS2
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillStandardDeviationSMS2, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillStandardDeviationSMS2
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillMeanGSMS2, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillMeanGSMS2
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillStandardDeviationGSMS2, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillStandardDeviationGSMS2
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillMeanMS3, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillMeanMS3
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillStandardDeviationMS3, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillStandardDeviationMS3
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillMeanSMS3, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillMeanSMS3
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillStandardDeviationSMS3, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillStandardDeviationSMS3
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillMeanGSMS3, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillMeanGSMS3
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillStandardDeviationGSMS3, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillStandardDeviationGSMS3
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillMeanMS4, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillMeanMS4
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillStandardDeviationMS4, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillStandardDeviationMS4
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillMeanSMS4, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillMeanSMS4
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillStandardDeviationSMS4, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillStandardDeviationSMS4
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillMeanGSMS4, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillMeanGSMS4
      ,'"' + CAST(LTRIM(REPLACE(STR(TrueSkillStandardDeviationGSMS4, 10, 2), ',', '.')) AS varchar) + '"' AS trueSkillStandardDeviationGSMS4	
	  ,'"' + CAST(WinsTotal+LossesTotal AS varchar) + '"' AS matchesTotal
	  ,'"' + CAST(CASE WHEN WinsTotal + LossesTotal > 0 THEN LTRIM(REPLACE(STR((CAST(WinsTotal AS FLOAT) * 100.0) / (WinsTotal + LossesTotal), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesWinRatio
	  ,'"' + CAST(CASE WHEN WinsTotal + LossesTotal > 0 THEN LTRIM(REPLACE(STR((CAST(LossesTotal AS FLOAT) * 100.0) / (WinsTotal + LossesTotal), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLossRatio
      ,'"' + CAST(WinsTotal AS varchar) + '"' AS winsTotal
      ,'"' + CAST(LossesTotal AS varchar) + '"' AS lossesTotal
	  ,'"' + CAST(WinsLastYear + LossesLastYear AS varchar) + '"' AS matchesLastYear
	  ,'"' + CAST(CASE WHEN WinsLastYear + LossesLastYear > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastYear AS FLOAT) * 100.0) / (WinsLastYear + LossesLastYear), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastYearWinRatio
	  ,'"' + CAST(CASE WHEN WinsLastYear + LossesLastYear > 0 THEN LTRIM(REPLACE(STR((CAST(LossesLastYear AS FLOAT) * 100.0) / (WinsLastYear + LossesLastYear), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastYearLossRatio
      ,'"' + CAST(WinsLastYear AS varchar) + '"' AS winsLastYear
      ,'"' + CAST(LossesLastYear AS varchar) + '"' AS lossesLastYear
	  ,'"' + CAST(WinsLastMonth + LossesLastMonth AS varchar) + '"' AS matchesLastMonth
	  ,'"' + CAST(CASE WHEN WinsLastMonth + LossesLastMonth > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastMonth AS FLOAT) * 100.0) / (WinsLastMonth + LossesLastMonth), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastMonthWinRatio
	  ,'"' + CAST(CASE WHEN WinsLastMonth + LossesLastMonth > 0 THEN LTRIM(REPLACE(STR((CAST(LossesLastMonth AS FLOAT) * 100.0) / (WinsLastMonth + LossesLastMonth), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastMonthLossRatio
      ,'"' + CAST(WinsLastMonth AS varchar) + '"' AS winsLastMonth
      ,'"' + CAST(LossesLastMonth AS varchar) + '"' AS lossesLastMonth
      ,'"' + CAST(WinsLastWeek + LossesLastWeek AS varchar) + '"' AS matchesLastWeek
      ,'"' + CAST(CASE WHEN WinsLastWeek + LossesLastWeek > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastWeek AS FLOAT) * 100.0) / (WinsLastWeek + LossesLastWeek), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastWeekWinRatio
      ,'"' + CAST(CASE WHEN WinsLastWeek + LossesLastWeek > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastWeek AS FLOAT) * 100.0) / (WinsLastWeek + LossesLastWeek), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastWeekWinRatio
      ,'"' + CAST(WinsLastWeek AS varchar) + '"' AS winsLastWeek
      ,'"' + CAST(LossesLastWeek AS varchar) + '"' AS lossesLastWeek
      ,'"' + CAST(WinsTotalS1 + LossesTotalS1 AS varchar) + '"' AS matchesTotalS1
      ,'"' + CAST(CASE WHEN WinsTotalS1 + LossesTotalS1 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsTotalS1 AS FLOAT) * 100.0) / (WinsTotalS1 + LossesTotalS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesTotalS1WinRatio
      ,'"' + CAST(CASE WHEN WinsTotalS1 + LossesTotalS1 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesTotalS1 AS FLOAT) * 100.0) / (WinsTotalS1 + LossesTotalS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesTotalS1LossRatio
      ,'"' + CAST(WinsTotalS1 AS varchar) + '"' AS winsTotalS1
      ,'"' + CAST(LossesTotalS1 AS varchar) + '"' AS lossesTotalS1
      ,'"' + CAST(WinsLastYearS1 + LossesLastYearS1 AS varchar) + '"' AS matchesLastYearS1
      ,'"' + CAST(CASE WHEN WinsLastYearS1 + LossesLastYearS1 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastYearS1 AS FLOAT) * 100.0) / (WinsLastYearS1 + LossesLastYearS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastYearS1WinRatio
      ,'"' + CAST(CASE WHEN WinsLastYearS1 + LossesLastYearS1 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesLastYearS1 AS FLOAT) * 100.0) / (WinsLastYearS1 + LossesLastYearS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastYearS1LossRatio
      ,'"' + CAST(WinsLastYearS1 AS varchar) + '"' AS winsLastYearS1
      ,'"' + CAST(LossesLastYearS1 AS varchar) + '"' AS lossesLastYearS1
      ,'"' + CAST(WinsLastMonthS1 + LossesLastMonthS1 AS varchar) + '"' AS matchesLastMonthS1
      ,'"' + CAST(CASE WHEN WinsLastMonthS1 + LossesLastMonthS1 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastMonthS1 AS FLOAT) * 100.0) / (WinsLastMonthS1 + LossesLastMonthS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastMonthS1WinRatio
      ,'"' + CAST(CASE WHEN WinsLastMonthS1 + LossesLastMonthS1 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesLastMonthS1 AS FLOAT) * 100.0) / (WinsLastMonthS1 + LossesLastMonthS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastMonthS1LossRatio
      ,'"' + CAST(WinsLastMonthS1 AS varchar) + '"' AS winsLastMonthS1
      ,'"' + CAST(LossesLastMonthS1 AS varchar) + '"' AS lossesLastMonthS1
      ,'"' + CAST(WinsLastWeekS1 + LossesLastWeekS1 AS varchar) + '"' AS matchesLastWeekS1
      ,'"' + CAST(CASE WHEN WinsLastWeekS1 + LossesLastWeekS1 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastWeekS1 AS FLOAT) * 100.0) / (WinsLastWeekS1 + LossesLastWeekS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastWeekS1WinRatio
      ,'"' + CAST(CASE WHEN WinsLastWeekS1 + LossesLastWeekS1 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesLastWeekS1 AS FLOAT) * 100.0) / (WinsLastWeekS1 + LossesLastWeekS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastWeekS1LossRatio
      ,'"' + CAST(WinsLastWeekS1 AS varchar) + '"' AS winsLastWeekS1
      ,'"' + CAST(LossesLastWeekS1 AS varchar) + '"' AS lossesLastWeekS1
      ,'"' + CAST(WinsTotalS2 + LossesTotalS2 AS varchar) + '"' AS matchesTotalS2
      ,'"' + CAST(CASE WHEN WinsTotalS2 + LossesTotalS2 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsTotalS2 AS FLOAT) * 100.0) / (WinsTotalS2 + LossesTotalS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesTotalS2WinRatio
      ,'"' + CAST(CASE WHEN WinsTotalS2 + LossesTotalS2 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesTotalS2 AS FLOAT) * 100.0) / (WinsTotalS2 + LossesTotalS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesTotalS2LossRatio
      ,'"' + CAST(WinsTotalS2 AS varchar) + '"' AS winsTotalS2
      ,'"' + CAST(LossesTotalS2 AS varchar) + '"' AS lossesTotalS2
      ,'"' + CAST(WinsLastYearS2 + LossesLastYearS2 AS varchar) + '"' AS matchesLastYearS2
      ,'"' + CAST(CASE WHEN WinsLastYearS2 + LossesLastYearS2 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastYearS2 AS FLOAT) * 100.0) / (WinsLastYearS2 + LossesLastYearS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastYearS2WinRatio
      ,'"' + CAST(CASE WHEN WinsLastYearS2 + LossesLastYearS2 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesLastYearS2 AS FLOAT) * 100.0) / (WinsLastYearS2 + LossesLastYearS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastYearS2LossRatio
      ,'"' + CAST(WinsLastYearS2 AS varchar) + '"' AS winsLastYearS2
      ,'"' + CAST(LossesLastYearS2 AS varchar) + '"' AS lossesLastYearS2
      ,'"' + CAST(WinsLastMonthS2 + LossesLastMonthS2 AS varchar) + '"' AS matchesLastMonthS2
      ,'"' + CAST(CASE WHEN WinsLastMonthS2 + LossesLastMonthS2 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastMonthS2 AS FLOAT) * 100.0) / (WinsLastMonthS2 + LossesLastMonthS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastMonthS2WinRatio
      ,'"' + CAST(CASE WHEN WinsLastMonthS2 + LossesLastMonthS2 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesLastMonthS2 AS FLOAT) * 100.0) / (WinsLastMonthS2 + LossesLastMonthS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastMonthS2LossRatio
      ,'"' + CAST(WinsLastMonthS2 AS varchar) + '"' AS winsLastMonthS2
      ,'"' + CAST(LossesLastMonthS2 AS varchar) + '"' AS lossesLastMonthS2
      ,'"' + CAST(WinsLastWeekS2 + LossesLastWeekS2 AS varchar) + '"' AS matchesLastWeekS2
      ,'"' + CAST(CASE WHEN WinsLastWeekS2 + LossesLastWeekS2 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastWeekS2 AS FLOAT) * 100.0) / (WinsLastWeekS2 + LossesLastWeekS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastWeekS2WinRatio
      ,'"' + CAST(CASE WHEN WinsLastWeekS2 + LossesLastWeekS2 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesLastWeekS2 AS FLOAT) * 100.0) / (WinsLastWeekS2 + LossesLastWeekS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastWeekS2LossRatio
      ,'"' + CAST(WinsLastWeekS2 AS varchar) + '"' AS winsLastWeekS2
      ,'"' + CAST(LossesLastWeekS2 AS varchar) + '"' AS lossesLastWeekS2
      ,'"' + CAST(WinsTotalS3 + LossesTotalS3 AS varchar) + '"' AS matchesTotalS3
      ,'"' + CAST(CASE WHEN WinsTotalS3 + LossesTotalS3 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsTotalS3 AS FLOAT) * 100.0) / (WinsTotalS3 + LossesTotalS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesTotalS3WinRatio
      ,'"' + CAST(CASE WHEN WinsTotalS3 + LossesTotalS3 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesTotalS3 AS FLOAT) * 100.0) / (WinsTotalS3 + LossesTotalS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesTotalS3LossRatio
      ,'"' + CAST(WinsTotalS3 AS varchar) + '"' AS winsTotalS3
      ,'"' + CAST(LossesTotalS3 AS varchar) + '"' AS lossesTotalS3
      ,'"' + CAST(WinsLastYearS3 + LossesLastYearS3 AS varchar) + '"' AS matchesLastYearS3
      ,'"' + CAST(CASE WHEN WinsLastYearS3 + LossesLastYearS3 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastYearS3 AS FLOAT) * 100.0) / (WinsLastYearS3 + LossesLastYearS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastYearS3WinRatio
      ,'"' + CAST(CASE WHEN WinsLastYearS3 + LossesLastYearS3 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesLastYearS3 AS FLOAT) * 100.0) / (WinsLastYearS3 + LossesLastYearS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastYearS3LossRatio
      ,'"' + CAST(WinsLastYearS3 AS varchar) + '"' AS winsLastYearS3
      ,'"' + CAST(LossesLastYearS3 AS varchar) + '"' AS lossesLastYearS3
      ,'"' + CAST(WinsLastMonthS3 + LossesLastMonthS3 AS varchar) + '"' AS matchesLastMonthS3
      ,'"' + CAST(CASE WHEN WinsLastMonthS3 + LossesLastMonthS3 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastMonthS3 AS FLOAT) * 100.0) / (WinsLastMonthS3 + LossesLastMonthS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastMonthS3WinRatio
      ,'"' + CAST(CASE WHEN WinsLastMonthS3 + LossesLastMonthS3 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesLastMonthS3 AS FLOAT) * 100.0) / (WinsLastMonthS3 + LossesLastMonthS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastMonthS3LossRatio
      ,'"' + CAST(WinsLastMonthS3 AS varchar) + '"' AS winsLastMonthS3
      ,'"' + CAST(LossesLastMonthS3 AS varchar) + '"' AS lossesLastMonthS3
      ,'"' + CAST(WinsLastWeekS3 + LossesLastWeekS3 AS varchar) + '"' AS matchesLastWeekS3
      ,'"' + CAST(CASE WHEN WinsLastWeekS3 + LossesLastWeekS3 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastWeekS3 AS FLOAT) * 100.0) / (WinsLastWeekS3 + LossesLastWeekS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastWeekS3WinRatio
      ,'"' + CAST(CASE WHEN WinsLastWeekS3 + LossesLastWeekS3 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesLastWeekS3 AS FLOAT) * 100.0) / (WinsLastWeekS3 + LossesLastWeekS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastWeekS3LossRatio
      ,'"' + CAST(WinsLastWeekS3 AS varchar) + '"' AS winsLastWeekS3
      ,'"' + CAST(LossesLastWeekS3 AS varchar) + '"' AS lossesLastWeekS3
      ,'"' + CAST(WinsTotalS4 + LossesTotalS4 AS varchar) + '"' AS matchesTotalS4
      ,'"' + CAST(CASE WHEN WinsTotalS4 + LossesTotalS4 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsTotalS4 AS FLOAT) * 100.0) / (WinsTotalS4 + LossesTotalS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesTotalS4WinRatio
      ,'"' + CAST(CASE WHEN WinsTotalS4 + LossesTotalS4 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesTotalS4 AS FLOAT) * 100.0) / (WinsTotalS4 + LossesTotalS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesTotalS4LossRatio
      ,'"' + CAST(WinsTotalS4 AS varchar) + '"' AS winsTotalS4
      ,'"' + CAST(LossesTotalS4 AS varchar) + '"' AS lossesTotalS4
      ,'"' + CAST(WinsLastYearS4 + LossesLastYearS4 AS varchar) + '"' AS matchesLastYearS4
      ,'"' + CAST(CASE WHEN WinsLastYearS4 + LossesLastYearS4 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastYearS4 AS FLOAT) * 100.0) / (WinsLastYearS4 + LossesLastYearS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastYearS4WinRatio
      ,'"' + CAST(CASE WHEN WinsLastYearS4 + LossesLastYearS4 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesLastYearS4 AS FLOAT) * 100.0) / (WinsLastYearS4 + LossesLastYearS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastYearS4LossRatio
      ,'"' + CAST(WinsLastYearS4 AS varchar) + '"' AS winsLastYearS4
      ,'"' + CAST(LossesLastYearS4 AS varchar) + '"' AS lossesLastYearS4
      ,'"' + CAST(WinsLastMonthS4 + LossesLastMonthS4 AS varchar) + '"' AS matchesLastMonthS4
      ,'"' + CAST(CASE WHEN WinsLastMonthS4 + LossesLastMonthS4 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastMonthS4 AS FLOAT) * 100.0) / (WinsLastMonthS4 + LossesLastMonthS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastMonthS4WinRatio
      ,'"' + CAST(CASE WHEN WinsLastMonthS4 + LossesLastMonthS4 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesLastMonthS4 AS FLOAT) * 100.0) / (WinsLastMonthS4 + LossesLastMonthS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastMonthS4LossRatio
      ,'"' + CAST(WinsLastMonthS4 AS varchar) + '"' AS winsLastMonthS4
      ,'"' + CAST(LossesLastMonthS4 AS varchar) + '"' AS lossesLastMonthS4
      ,'"' + CAST(WinsLastWeekS4 + LossesLastWeekS4 AS varchar) + '"' AS matchesLastWeekS4
      ,'"' + CAST(CASE WHEN WinsLastWeekS4 + LossesLastWeekS4 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsLastWeekS4 AS FLOAT) * 100.0) / (WinsLastWeekS4 + LossesLastWeekS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastWeekS4WinRatio
      ,'"' + CAST(CASE WHEN WinsLastWeekS4 + LossesLastWeekS4 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesLastWeekS4 AS FLOAT) * 100.0) / (WinsLastWeekS4 + LossesLastWeekS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS matchesLastWeekS4LossRatio
      ,'"' + CAST(WinsLastWeekS4 AS varchar) + '"' AS winsLastWeekS4
      ,'"' + CAST(LossesLastWeekS4 AS varchar) + '"' AS lossesLastWeekS4
	  ,'"' + CAST(WinsSetsTotal+LossesSetsTotal AS varchar) + '"' AS setsTotal
	  ,'"' + CAST(CASE WHEN WinsSetsTotal + LossesSetsTotal > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsTotal AS FLOAT) * 100.0) / (WinsSetsTotal + LossesSetsTotal), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsWinRatio
	  ,'"' + CAST(CASE WHEN WinsSetsTotal + LossesSetsTotal > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsTotal AS FLOAT) * 100.0) / (WinsSetsTotal + LossesSetsTotal), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLossRatio
      ,'"' + CAST(WinsSetsTotal AS varchar) + '"' AS winsSetsTotal
      ,'"' + CAST(LossesSetsTotal AS varchar) + '"' AS lossesSetsTotal
	  ,'"' + CAST(WinsSetsLastYear + LossesSetsLastYear AS varchar) + '"' AS setsLastYear
	  ,'"' + CAST(CASE WHEN WinsSetsLastYear + LossesSetsLastYear > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsLastYear AS FLOAT) * 100.0) / (WinsSetsLastYear + LossesSetsLastYear), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastYearWinRatio
	  ,'"' + CAST(CASE WHEN WinsSetsLastYear + LossesSetsLastYear > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsLastYear AS FLOAT) * 100.0) / (WinsSetsLastYear + LossesSetsLastYear), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastYearLossRatio
      ,'"' + CAST(WinsSetsLastYear AS varchar) + '"' AS winsSetsLastYear
      ,'"' + CAST(LossesSetsLastYear AS varchar) + '"' AS lossesSetsLastYear
	  ,'"' + CAST(WinsSetsLastMonth + LossesSetsLastMonth AS varchar) + '"' AS setsLastMonth
	  ,'"' + CAST(CASE WHEN WinsSetsLastMonth + LossesSetsLastMonth > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsLastMonth AS FLOAT) * 100.0) / (WinsSetsLastMonth + LossesSetsLastMonth), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastMonthWinRatio
	  ,'"' + CAST(CASE WHEN WinsSetsLastMonth + LossesSetsLastMonth > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsLastMonth AS FLOAT) * 100.0) / (WinsSetsLastMonth + LossesSetsLastMonth), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastMonthLossRatio
      ,'"' + CAST(WinsSetsLastMonth AS varchar) + '"' AS winsSetsLastMonth
      ,'"' + CAST(LossesSetsLastMonth AS varchar) + '"' AS lossesSetsLastMonth
      ,'"' + CAST(WinsSetsLastWeek + LossesSetsLastWeek AS varchar) + '"' AS setsLastWeek
      ,'"' + CAST(CASE WHEN WinsSetsLastWeek + LossesSetsLastWeek > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsLastWeek AS FLOAT) * 100.0) / (WinsSetsLastWeek + LossesSetsLastWeek), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastWeekWinRatio
      ,'"' + CAST(CASE WHEN WinsSetsLastWeek + LossesSetsLastWeek > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsLastWeek AS FLOAT) * 100.0) / (WinsSetsLastWeek + LossesSetsLastWeek), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastWeekLossRatio
      ,'"' + CAST(WinsSetsLastWeek AS varchar) + '"' AS winsSetsLastWeek
      ,'"' + CAST(LossesSetsLastWeek AS varchar) + '"' AS lossesSetsLastWeek
      ,'"' + CAST(WinsSetsTotalS1 + LossesSetsTotalS1 AS varchar) + '"' AS setsTotalS1
      ,'"' + CAST(CASE WHEN WinsSetsTotalS1 + LossesSetsTotalS1 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsTotalS1 AS FLOAT) * 100.0) / (WinsSetsTotalS1 + LossesSetsTotalS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsTotalS1WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsTotalS1 + LossesSetsTotalS1 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsTotalS1 AS FLOAT) * 100.0) / (WinsSetsTotalS1 + LossesSetsTotalS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsTotalS1LossRatio
      ,'"' + CAST(WinsSetsTotalS1 AS varchar) + '"' AS winsSetsTotalS1
      ,'"' + CAST(LossesSetsTotalS1 AS varchar) + '"' AS lossesSetsTotalS1
      ,'"' + CAST(WinsSetsLastYearS1 + LossesSetsLastYearS1 AS varchar) + '"' AS setsLastYearS1
      ,'"' + CAST(CASE WHEN WinsSetsLastYearS1 + LossesSetsLastYearS1 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsLastYearS1 AS FLOAT) * 100.0) / (WinsSetsLastYearS1 + LossesSetsLastYearS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastYearS1WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsLastYearS1 + LossesSetsLastYearS1 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsLastYearS1 AS FLOAT) * 100.0) / (WinsSetsLastYearS1 + LossesSetsLastYearS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastYearS1LossRatio
      ,'"' + CAST(WinsSetsLastYearS1 AS varchar) + '"' AS winsSetsLastYearS1
      ,'"' + CAST(LossesSetsLastYearS1 AS varchar) + '"' AS lossesSetsLastYearS1
      ,'"' + CAST(WinsSetsLastMonthS1 + LossesSetsLastMonthS1 AS varchar) + '"' AS setsLastMonthS1
      ,'"' + CAST(CASE WHEN WinsSetsLastMonthS1 + LossesSetsLastMonthS1 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsLastMonthS1 AS FLOAT) * 100.0) / (WinsSetsLastMonthS1 + LossesSetsLastMonthS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastMonthS1WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsLastMonthS1 + LossesSetsLastMonthS1 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsLastMonthS1 AS FLOAT) * 100.0) / (WinsSetsLastMonthS1 + LossesSetsLastMonthS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastMonthS1LossRatio
      ,'"' + CAST(WinsSetsLastMonthS1 AS varchar) + '"' AS winsSetsLastMonthS1
      ,'"' + CAST(LossesSetsLastMonthS1 AS varchar) + '"' AS lossesSetsLastMonthS1
      ,'"' + CAST(WinsSetsLastWeekS1 + LossesSetsLastWeekS1 AS varchar) + '"' AS setsLastWeekS1
      ,'"' + CAST(CASE WHEN WinsSetsLastWeekS1 + LossesSetsLastWeekS1 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsLastWeekS1 AS FLOAT) * 100.0) / (WinsSetsLastWeekS1 + LossesSetsLastWeekS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastWeekS1WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsLastWeekS1 + LossesSetsLastWeekS1 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsLastWeekS1 AS FLOAT) * 100.0) / (WinsSetsLastWeekS1 + LossesSetsLastWeekS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastWeekS1LossRatio
      ,'"' + CAST(WinsSetsLastWeekS1 AS varchar) + '"' AS winsSetsLastWeekS1
      ,'"' + CAST(LossesSetsLastWeekS1 AS varchar) + '"' AS lossesSetsLastWeekS1
      ,'"' + CAST(WinsSetsTotalS2 + LossesSetsTotalS2 AS varchar) + '"' AS setsTotalS2
      ,'"' + CAST(CASE WHEN WinsSetsTotalS2 + LossesSetsTotalS2 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsTotalS2 AS FLOAT) * 100.0) / (WinsSetsTotalS2 + LossesSetsTotalS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsTotalS2WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsTotalS2 + LossesSetsTotalS2 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsTotalS2 AS FLOAT) * 100.0) / (WinsSetsTotalS2 + LossesSetsTotalS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsTotalS2LossRatio
      ,'"' + CAST(WinsSetsTotalS2 AS varchar) + '"' AS winsSetsTotalS2
      ,'"' + CAST(LossesSetsTotalS2 AS varchar) + '"' AS lossesSetsTotalS2
      ,'"' + CAST(WinsSetsLastYearS2 + LossesSetsLastYearS2 AS varchar) + '"' AS setsLastYearS2
      ,'"' + CAST(CASE WHEN WinsSetsLastYearS2 + LossesSetsLastYearS2 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsLastYearS2 AS FLOAT) * 100.0) / (WinsSetsLastYearS2 + LossesSetsLastYearS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastYearS2WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsLastYearS2 + LossesSetsLastYearS2 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsLastYearS2 AS FLOAT) * 100.0) / (WinsSetsLastYearS2 + LossesSetsLastYearS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastYearS2LossRatio
      ,'"' + CAST(WinsSetsLastYearS2 AS varchar) + '"' AS winsSetsLastYearS2
      ,'"' + CAST(LossesSetsLastYearS2 AS varchar) + '"' AS lossesSetsLastYearS2
      ,'"' + CAST(WinsSetsLastMonthS2 + LossesSetsLastMonthS2 AS varchar) + '"' AS setsLastMonthS2
      ,'"' + CAST(CASE WHEN WinsSetsLastMonthS2 + LossesSetsLastMonthS2 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsLastMonthS2 AS FLOAT) * 100.0) / (WinsSetsLastMonthS2 + LossesSetsLastMonthS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastMonthS2WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsLastMonthS2 + LossesSetsLastMonthS2 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsLastMonthS2 AS FLOAT) * 100.0) / (WinsSetsLastMonthS2 + LossesSetsLastMonthS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastMonthS2LossRatio
      ,'"' + CAST(WinsSetsLastMonthS2 AS varchar) + '"' AS winsSetsLastMonthS2
      ,'"' + CAST(LossesSetsLastMonthS2 AS varchar) + '"' AS lossesSetsLastMonthS2
      ,'"' + CAST(WinsSetsLastWeekS2 + LossesSetsLastWeekS2 AS varchar) + '"' AS setsLastWeekS2
      ,'"' + CAST(CASE WHEN WinsSetsLastWeekS2 + LossesSetsLastWeekS2 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsLastWeekS2 AS FLOAT) * 100.0) / (WinsSetsLastWeekS2 + LossesSetsLastWeekS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastWeekS2WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsLastWeekS2 + LossesSetsLastWeekS2 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsLastWeekS2 AS FLOAT) * 100.0) / (WinsSetsLastWeekS2 + LossesSetsLastWeekS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastWeekS2LossRatio
      ,'"' + CAST(WinsSetsLastWeekS2 AS varchar) + '"' AS winsSetsLastWeekS2
      ,'"' + CAST(LossesSetsLastWeekS2 AS varchar) + '"' AS lossesSetsLastWeekS2
      ,'"' + CAST(WinsSetsTotalS3 + LossesSetsTotalS3 AS varchar) + '"' AS setsTotalS3
      ,'"' + CAST(CASE WHEN WinsSetsTotalS3 + WinsSetsTotalS3 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsTotalS3 AS FLOAT) * 100.0) / (WinsSetsTotalS3 + LossesSetsTotalS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsTotalS3WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsTotalS3 + WinsSetsTotalS3 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsTotalS3 AS FLOAT) * 100.0) / (WinsSetsTotalS3 + LossesSetsTotalS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsTotalS3LossRatio
      ,'"' + CAST(WinsSetsTotalS3 AS varchar) + '"' AS winsSetsTotalS3
      ,'"' + CAST(LossesSetsTotalS3 AS varchar) + '"' AS lossesSetsTotalS3
      ,'"' + CAST(WinsSetsLastYearS3 + LossesSetsLastYearS3 AS varchar) + '"' AS setsLastYearS3
      ,'"' + CAST(CASE WHEN WinsSetsLastYearS3 + LossesSetsLastYearS3 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsLastYearS3 AS FLOAT) * 100.0) / (WinsSetsLastYearS3 + LossesSetsLastYearS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastYearS3WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsLastYearS3 + LossesSetsLastYearS3 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsLastYearS3 AS FLOAT) * 100.0) / (WinsSetsLastYearS3 + LossesSetsLastYearS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastYearS3LossRatio
      ,'"' + CAST(WinsSetsLastYearS3 AS varchar) + '"' AS winsSetsLastYearS3
      ,'"' + CAST(LossesSetsLastYearS3 AS varchar) + '"' AS lossesSetsLastYearS3
      ,'"' + CAST(WinsSetsLastMonthS3 + LossesSetsLastMonthS3 AS varchar) + '"' AS setsLastMonthS3
      ,'"' + CAST(CASE WHEN WinsSetsLastMonthS3 + LossesSetsLastMonthS3 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsLastMonthS3 AS FLOAT) * 100.0) / (WinsSetsLastMonthS3 + LossesSetsLastMonthS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastMonthS3WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsLastMonthS3 + LossesSetsLastMonthS3 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsLastMonthS3 AS FLOAT) * 100.0) / (WinsSetsLastMonthS3 + LossesSetsLastMonthS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastMonthS3LossRatio
      ,'"' + CAST(WinsSetsLastMonthS3 AS varchar) + '"' AS winsSetsLastMonthS3
      ,'"' + CAST(LossesSetsLastMonthS3 AS varchar) + '"' AS lossesSetsLastMonthS3
      ,'"' + CAST(WinsSetsLastWeekS3 + LossesSetsLastWeekS3 AS varchar) + '"' AS setsLastWeekS3
      ,'"' + CAST(CASE WHEN WinsSetsLastWeekS3 + LossesSetsLastWeekS3 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsLastWeekS3 AS FLOAT) * 100.0) / (WinsSetsLastWeekS3 + LossesSetsLastWeekS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastWeekS3WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsLastWeekS3 + LossesSetsLastWeekS3 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsLastWeekS3 AS FLOAT) * 100.0) / (WinsSetsLastWeekS3 + LossesSetsLastWeekS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastWeekS3LossRatio
      ,'"' + CAST(WinsSetsLastWeekS3 AS varchar) + '"' AS winsSetsLastWeekS3
      ,'"' + CAST(LossesSetsLastWeekS3 AS varchar) + '"' AS lossesSetsLastWeekS3
      ,'"' + CAST(WinsSetsTotalS4 + LossesSetsTotalS4 AS varchar) + '"' AS setsTotalS4
      ,'"' + CAST(CASE WHEN WinsSetsTotalS4 + LossesSetsTotalS4 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsTotalS4 AS FLOAT) * 100.0) / (WinsSetsTotalS4 + LossesSetsTotalS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsTotalS4WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsTotalS4 + LossesSetsTotalS4 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsTotalS4 AS FLOAT) * 100.0) / (WinsSetsTotalS4 + LossesSetsTotalS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsTotalS4LossRatio
      ,'"' + CAST(WinsSetsTotalS4 AS varchar) + '"' AS winsSetsTotalS4
      ,'"' + CAST(LossesSetsTotalS4 AS varchar) + '"' AS lossesSetsTotalS4
      ,'"' + CAST(WinsSetsLastYearS4 + LossesSetsLastYearS4 AS varchar) + '"' AS setsLastYearS4
      ,'"' + CAST(CASE WHEN WinsSetsLastYearS4 + LossesSetsLastYearS4 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsLastYearS4 AS FLOAT) * 100.0) / (WinsSetsLastYearS4 + LossesSetsLastYearS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastYearS4WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsLastYearS4 + LossesSetsLastYearS4 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsLastYearS4 AS FLOAT) * 100.0) / (WinsSetsLastYearS4 + LossesSetsLastYearS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastYearS4LossRatio
      ,'"' + CAST(WinsSetsLastYearS4 AS varchar) + '"' AS winsSetsLastYearS4
      ,'"' + CAST(LossesSetsLastYearS4 AS varchar) + '"' AS lossesSetsLastYearS4
      ,'"' + CAST(WinsSetsLastMonthS4 + LossesSetsLastMonthS4 AS varchar) + '"' AS setsLastMonthS4
      ,'"' + CAST(CASE WHEN WinsSetsLastMonthS4 + LossesSetsLastMonthS4 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsLastMonthS4 AS FLOAT) * 100.0) / (WinsSetsLastMonthS4 + LossesSetsLastMonthS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastMonthS4WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsLastMonthS4 + LossesSetsLastMonthS4 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsLastMonthS4 AS FLOAT) * 100.0) / (WinsSetsLastMonthS4 + LossesSetsLastMonthS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastMonthS4LossRatio
      ,'"' + CAST(WinsSetsLastMonthS4 AS varchar) + '"' AS winsSetsLastMonthS4
      ,'"' + CAST(LossesSetsLastMonthS4 AS varchar) + '"' AS lossesSetsLastMonthS4
      ,'"' + CAST(WinsSetsLastWeekS4 + LossesSetsLastWeekS4 AS varchar) + '"' AS setsLastWeekS4
      ,'"' + CAST(CASE WHEN WinsSetsLastWeekS4 + LossesSetsLastWeekS4 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsSetsLastWeekS4 AS FLOAT) * 100.0) / (WinsSetsLastWeekS4 + LossesSetsLastWeekS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastWeekS4WinRatio
      ,'"' + CAST(CASE WHEN WinsSetsLastWeekS4 + LossesSetsLastWeekS4 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesSetsLastWeekS4 AS FLOAT) * 100.0) / (WinsSetsLastWeekS4 + LossesSetsLastWeekS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS setsLastWeekS4LossRatio
      ,'"' + CAST(WinsSetsLastWeekS4 AS varchar) + '"' AS winsSetsLastWeekS4
      ,'"' + CAST(LossesSetsLastWeekS4 AS varchar) + '"' AS lossesSetsLastWeekS4
	  ,'"' + CAST(WinsGamesTotal+LossesGamesTotal AS varchar) + '"' AS gamesTotal
	  ,'"' + CAST(CASE WHEN WinsGamesTotal + LossesGamesTotal > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesTotal AS FLOAT) * 100.0) / (WinsGamesTotal + LossesGamesTotal), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesWinRatio
	  ,'"' + CAST(CASE WHEN WinsGamesTotal + LossesGamesTotal > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesTotal AS FLOAT) * 100.0) / (WinsGamesTotal + LossesGamesTotal), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLossRatio
      ,'"' + CAST(WinsGamesTotal AS varchar) + '"' AS winsGamesTotal
      ,'"' + CAST(LossesGamesTotal AS varchar) + '"' AS lossesGamesTotal
	  ,'"' + CAST(WinsGamesLastYear + LossesGamesLastYear AS varchar) + '"' AS gamesLastYear
	  ,'"' + CAST(CASE WHEN WinsGamesLastYear + LossesGamesLastYear > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesLastYear AS FLOAT) * 100.0) / (WinsGamesLastYear + LossesGamesLastYear), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastYearWinRatio
	  ,'"' + CAST(CASE WHEN WinsGamesLastYear + LossesGamesLastYear > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesLastYear AS FLOAT) * 100.0) / (WinsGamesLastYear + LossesGamesLastYear), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastYearLossRatio
      ,'"' + CAST(WinsGamesLastYear AS varchar) + '"' AS winsGamesLastYear
      ,'"' + CAST(LossesGamesLastYear AS varchar) + '"' AS lossesGamesLastYear
	  ,'"' + CAST(WinsGamesLastMonth + LossesGamesLastMonth AS varchar) + '"' AS gamesLastMonth
	  ,'"' + CAST(CASE WHEN WinsGamesLastMonth + LossesGamesLastMonth > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesLastMonth AS FLOAT) * 100.0) / (WinsGamesLastMonth + LossesGamesLastMonth), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastMonthWinRatio
	  ,'"' + CAST(CASE WHEN WinsGamesLastMonth + LossesGamesLastMonth > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesLastMonth AS FLOAT) * 100.0) / (WinsGamesLastMonth + LossesGamesLastMonth), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastMonthLossRatio
      ,'"' + CAST(WinsGamesLastMonth AS varchar) + '"' AS winsGamesLastMonth
      ,'"' + CAST(LossesGamesLastMonth AS varchar) + '"' AS lossesGamesLastMonth
      ,'"' + CAST(WinsGamesLastWeek + LossesGamesLastWeek AS varchar) + '"' AS gamesLastWeek
      ,'"' + CAST(CASE WHEN WinsGamesLastWeek + LossesGamesLastWeek > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesLastWeek AS FLOAT) * 100.0) / (WinsGamesLastWeek + LossesGamesLastWeek), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastWeekWinRatio
      ,'"' + CAST(CASE WHEN WinsGamesLastWeek + LossesGamesLastWeek > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesLastWeek AS FLOAT) * 100.0) / (WinsGamesLastWeek + LossesGamesLastWeek), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastWeekLossRatio
      ,'"' + CAST(WinsGamesLastWeek AS varchar) + '"' AS winsGamesLastWeek
      ,'"' + CAST(LossesGamesLastWeek AS varchar) + '"' AS lossesGamesLastWeek
      ,'"' + CAST(WinsGamesTotalS1 + LossesGamesTotalS1 AS varchar) + '"' AS gamesTotalS1
      ,'"' + CAST(CASE WHEN WinsGamesTotalS1 + LossesGamesTotalS1 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesTotalS1 AS FLOAT) * 100.0) / (WinsGamesTotalS1 + LossesGamesTotalS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesTotalS1WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesTotalS1 + LossesGamesTotalS1 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesTotalS1 AS FLOAT) * 100.0) / (WinsGamesTotalS1 + LossesGamesTotalS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesTotalS1LossRatio
      ,'"' + CAST(WinsGamesTotalS1 AS varchar) + '"' AS winsGamesTotalS1
      ,'"' + CAST(LossesGamesTotalS1 AS varchar) + '"' AS lossesGamesTotalS1
      ,'"' + CAST(WinsGamesLastYearS1 + LossesGamesLastYearS1 AS varchar) + '"' AS gamesLastYearS1
      ,'"' + CAST(CASE WHEN WinsGamesLastYearS1 + LossesGamesLastYearS1 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesLastYearS1 AS FLOAT) * 100.0) / (WinsGamesLastYearS1 + LossesGamesLastYearS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastYearS1WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesLastYearS1 + LossesGamesLastYearS1 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesLastYearS1 AS FLOAT) * 100.0) / (WinsGamesLastYearS1 + LossesGamesLastYearS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastYearS1LossRatio
      ,'"' + CAST(WinsGamesLastYearS1 AS varchar) + '"' AS winsGamesLastYearS1
      ,'"' + CAST(LossesGamesLastYearS1 AS varchar) + '"' AS lossesGamesLastYearS1
      ,'"' + CAST(WinsGamesLastMonthS1 + LossesGamesLastMonthS1 AS varchar) + '"' AS gamesLastMonthS1
      ,'"' + CAST(CASE WHEN WinsGamesLastMonthS1 + LossesGamesLastMonthS1 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesLastMonthS1 AS FLOAT) * 100.0) / (WinsGamesLastMonthS1 + LossesGamesLastMonthS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastMonthS1WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesLastMonthS1 + LossesGamesLastMonthS1 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesLastMonthS1 AS FLOAT) * 100.0) / (WinsGamesLastMonthS1 + LossesGamesLastMonthS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastMonthS1LossRatio
      ,'"' + CAST(WinsGamesLastMonthS1 AS varchar) + '"' AS winsGamesLastMonthS1
      ,'"' + CAST(LossesGamesLastMonthS1 AS varchar) + '"' AS lossesGamesLastMonthS1
      ,'"' + CAST(WinsGamesLastWeekS1 + LossesGamesLastWeekS1 AS varchar) + '"' AS gamesLastWeekS1
      ,'"' + CAST(CASE WHEN WinsGamesLastWeekS1 + LossesGamesLastWeekS1 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesLastWeekS1 AS FLOAT) * 100.0) / (WinsGamesLastWeekS1 + LossesGamesLastWeekS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastWeekS1WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesLastWeekS1 + LossesGamesLastWeekS1 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesLastWeekS1 AS FLOAT) * 100.0) / (WinsGamesLastWeekS1 + LossesGamesLastWeekS1), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastWeekS1LossRatio
      ,'"' + CAST(WinsGamesLastWeekS1 AS varchar) + '"' AS winsGamesLastWeekS1
      ,'"' + CAST(LossesGamesLastWeekS1 AS varchar) + '"' AS lossesGamesLastWeekS1
      ,'"' + CAST(WinsGamesTotalS2 + LossesGamesTotalS2 AS varchar) + '"' AS gamesTotalS2
      ,'"' + CAST(CASE WHEN WinsGamesTotalS2 + LossesGamesTotalS2 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesTotalS2 AS FLOAT) * 100.0) / (WinsGamesTotalS2 + LossesGamesTotalS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesTotalS2WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesTotalS2 + LossesGamesTotalS2 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesTotalS2 AS FLOAT) * 100.0) / (WinsGamesTotalS2 + LossesGamesTotalS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesTotalS2LossRatio
      ,'"' + CAST(WinsGamesTotalS2 AS varchar) + '"' AS winsGamesTotalS2
      ,'"' + CAST(LossesGamesTotalS2 AS varchar) + '"' AS lossesGamesTotalS2
      ,'"' + CAST(WinsGamesLastYearS2 + LossesGamesLastYearS2 AS varchar) + '"' AS gamesLastYearS2
      ,'"' + CAST(CASE WHEN WinsGamesLastYearS2 + LossesGamesLastYearS2 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesLastYearS2 AS FLOAT) * 100.0) / (WinsGamesLastYearS2 + LossesGamesLastYearS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastYearS2WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesLastYearS2 + LossesGamesLastYearS2 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesLastYearS2 AS FLOAT) * 100.0) / (WinsGamesLastYearS2 + LossesGamesLastYearS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastYearS2LossRatio
      ,'"' + CAST(WinsGamesLastYearS2 AS varchar) + '"' AS winsGamesLastYearS2
      ,'"' + CAST(LossesGamesLastYearS2 AS varchar) + '"' AS lossesGamesLastYearS2
      ,'"' + CAST(WinsGamesLastMonthS2 + LossesGamesLastMonthS2 AS varchar) + '"' AS gamesLastMonthS2
      ,'"' + CAST(CASE WHEN WinsGamesLastMonthS2 + LossesGamesLastMonthS2 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesLastMonthS2 AS FLOAT) * 100.0) / (WinsGamesLastMonthS2 + LossesGamesLastMonthS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastMonthS2WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesLastMonthS2 + LossesGamesLastMonthS2 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesLastMonthS2 AS FLOAT) * 100.0) / (WinsGamesLastMonthS2 + LossesGamesLastMonthS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastMonthS2LossRatio
      ,'"' + CAST(WinsGamesLastMonthS2 AS varchar) + '"' AS winsGamesLastMonthS2
      ,'"' + CAST(LossesGamesLastMonthS2 AS varchar) + '"' AS lossesGamesLastMonthS2
      ,'"' + CAST(WinsGamesLastWeekS2 + LossesGamesLastWeekS2 AS varchar) + '"' AS gamesLastWeekS2
      ,'"' + CAST(CASE WHEN WinsGamesLastWeekS2 + LossesGamesLastWeekS2 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesLastWeekS2 AS FLOAT) * 100.0) / (WinsGamesLastWeekS2 + LossesGamesLastWeekS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastWeekS2WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesLastWeekS2 + LossesGamesLastWeekS2 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesLastWeekS2 AS FLOAT) * 100.0) / (WinsGamesLastWeekS2 + LossesGamesLastWeekS2), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastWeekS2LossRatio
      ,'"' + CAST(WinsGamesLastWeekS2 AS varchar) + '"' AS winsGamesLastWeekS2
      ,'"' + CAST(LossesGamesLastWeekS2 AS varchar) + '"' AS lossesGamesLastWeekS2
      ,'"' + CAST(WinsGamesTotalS3 + LossesGamesTotalS3 AS varchar) + '"' AS gamesTotalS3
      ,'"' + CAST(CASE WHEN WinsGamesTotalS3 + LossesGamesTotalS3 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesTotalS3 AS FLOAT) * 100.0) / (WinsGamesTotalS3 + LossesGamesTotalS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesTotalS3WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesTotalS3 + LossesGamesTotalS3 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesTotalS3 AS FLOAT) * 100.0) / (WinsGamesTotalS3 + LossesGamesTotalS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesTotalS3LossRatio
      ,'"' + CAST(WinsGamesTotalS3 AS varchar) + '"' AS winsGamesTotalS3
      ,'"' + CAST(LossesGamesTotalS3 AS varchar) + '"' AS lossesGamesTotalS3
      ,'"' + CAST(WinsGamesLastYearS3 + LossesGamesLastYearS3 AS varchar) + '"' AS gamesLastYearS3
      ,'"' + CAST(CASE WHEN WinsGamesLastYearS3 + LossesGamesLastYearS3 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesLastYearS3 AS FLOAT) * 100.0) / (WinsGamesLastYearS3 + LossesGamesLastYearS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastYearS3WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesLastYearS3 + LossesGamesLastYearS3 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesLastYearS3 AS FLOAT) * 100.0) / (WinsGamesLastYearS3 + LossesGamesLastYearS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastYearS3LossRatio
      ,'"' + CAST(WinsGamesLastYearS3 AS varchar) + '"' AS winsGamesLastYearS3
      ,'"' + CAST(LossesGamesLastYearS3 AS varchar) + '"' AS lossesGamesLastYearS3
      ,'"' + CAST(WinsGamesLastMonthS3 + LossesGamesLastMonthS3 AS varchar) + '"' AS gamesLastMonthS3
      ,'"' + CAST(CASE WHEN WinsGamesLastMonthS3 + LossesGamesLastMonthS3 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesLastMonthS3 AS FLOAT) * 100.0) / (WinsGamesLastMonthS3 + LossesGamesLastMonthS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastMonthS3WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesLastMonthS3 + LossesGamesLastMonthS3 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesLastMonthS3 AS FLOAT) * 100.0) / (WinsGamesLastMonthS3 + LossesGamesLastMonthS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastMonthS3LossRatio
      ,'"' + CAST(WinsGamesLastMonthS3 AS varchar) + '"' AS winsGamesLastMonthS3
      ,'"' + CAST(LossesGamesLastMonthS3 AS varchar) + '"' AS lossesGamesLastMonthS3
      ,'"' + CAST(WinsGamesLastWeekS3 + LossesGamesLastWeekS3 AS varchar) + '"' AS gamesLastWeekS3
      ,'"' + CAST(CASE WHEN WinsGamesLastWeekS3 + LossesGamesLastWeekS3 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesLastWeekS3 AS FLOAT) * 100.0) / (WinsGamesLastWeekS3 + LossesGamesLastWeekS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastWeekS3WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesLastWeekS3 + LossesGamesLastWeekS3 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesLastWeekS3 AS FLOAT) * 100.0) / (WinsGamesLastWeekS3 + LossesGamesLastWeekS3), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastWeekS3LossRatio
      ,'"' + CAST(WinsGamesLastWeekS3 AS varchar) + '"' AS winsGamesLastWeekS3
      ,'"' + CAST(LossesGamesLastWeekS3 AS varchar) + '"' AS lossesGamesLastWeekS3
      ,'"' + CAST(WinsGamesTotalS4 + LossesGamesTotalS4 AS varchar) + '"' AS gamesTotalS4
      ,'"' + CAST(CASE WHEN WinsGamesTotalS4 + LossesGamesTotalS4 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesTotalS4 AS FLOAT) * 100.0) / (WinsGamesTotalS4 + LossesGamesTotalS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesTotalS4WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesTotalS4 + LossesGamesTotalS4 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesTotalS4 AS FLOAT) * 100.0) / (WinsGamesTotalS4 + LossesGamesTotalS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesTotalS4LossRatio
      ,'"' + CAST(WinsGamesTotalS4 AS varchar) + '"' AS winsGamesTotalS4
      ,'"' + CAST(LossesGamesTotalS4 AS varchar) + '"' AS lossesGamesTotalS4
      ,'"' + CAST(WinsGamesLastYearS4 + LossesGamesLastYearS4 AS varchar) + '"' AS gamesLastYearS4
      ,'"' + CAST(CASE WHEN WinsGamesLastYearS4 + LossesGamesLastYearS4 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesLastYearS4 AS FLOAT) * 100.0) / (WinsGamesLastYearS4 + LossesGamesLastYearS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastYearS4WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesLastYearS4 + LossesGamesLastYearS4 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesLastYearS4 AS FLOAT) * 100.0) / (WinsGamesLastYearS4 + LossesGamesLastYearS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastYearS4LossRatio
      ,'"' + CAST(WinsGamesLastYearS4 AS varchar) + '"' AS winsGamesLastYearS4
      ,'"' + CAST(LossesGamesLastYearS4 AS varchar) + '"' AS lossesGamesLastYearS4
      ,'"' + CAST(WinsGamesLastMonthS4 + LossesGamesLastMonthS4 AS varchar) + '"' AS gamesLastMonthS4
      ,'"' + CAST(CASE WHEN WinsGamesLastMonthS4 + LossesGamesLastMonthS4 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesLastMonthS4 AS FLOAT) * 100.0) / (WinsGamesLastMonthS4 + LossesGamesLastMonthS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastMonthS4WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesLastMonthS4 + LossesGamesLastMonthS4 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesLastMonthS4 AS FLOAT) * 100.0) / (WinsGamesLastMonthS4 + LossesGamesLastMonthS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastMonthS4LossRatio
      ,'"' + CAST(WinsGamesLastMonthS4 AS varchar) + '"' AS winsGamesLastMonthS4
      ,'"' + CAST(LossesGamesLastMonthS4 AS varchar) + '"' AS lossesGamesLastMonthS4
      ,'"' + CAST(WinsGamesLastWeekS4 + LossesGamesLastWeekS4 AS varchar) + '"' AS gamesLastWeekS4
      ,'"' + CAST(CASE WHEN WinsGamesLastWeekS4 + LossesGamesLastWeekS4 > 0 THEN LTRIM(REPLACE(STR((CAST(WinsGamesLastWeekS4 AS FLOAT) * 100.0) / (WinsGamesLastWeekS4 + LossesGamesLastWeekS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastWeekS4WinRatio
      ,'"' + CAST(CASE WHEN WinsGamesLastWeekS4 + LossesGamesLastWeekS4 > 0 THEN LTRIM(REPLACE(STR((CAST(LossesGamesLastWeekS4 AS FLOAT) * 100.0) / (WinsGamesLastWeekS4 + LossesGamesLastWeekS4), 10, 2), ',', '.')) ELSE '' END AS varchar) + '"' AS gamesLastWeekS4LossRatio
      ,'"' + CAST(WinsGamesLastWeekS4 AS varchar) + '"' AS winsGamesLastWeekS4
      ,'"' + CAST(LossesGamesLastWeekS4 AS varchar) + '"' AS lLossesGamesLastWeekS4
      ,'"' + CAST(ISNULL(CONVERT(varchar, DateSinceLastWin, 23), NULL) AS varchar) + '"' AS dateSinceLastWin
      ,'"' + CAST(ISNULL(CONVERT(varchar, DateSinceLastWinS1, 23), NULL) AS varchar) + '"' AS dateSinceLastWinS1
      ,'"' + CAST(ISNULL(CONVERT(varchar, DateSinceLastWinS2, 23), NULL) AS varchar) + '"' AS dateSinceLastWinS2
      ,'"' + CAST(ISNULL(CONVERT(varchar, DateSinceLastWinS3, 23), NULL) AS varchar) + '"' AS dateSinceLastWinS3
      ,'"' + CAST(ISNULL(CONVERT(varchar, DateSinceLastWinS4, 23), NULL) AS varchar) + '"' AS dateSinceLastWinS4
      ,'"' + CAST(ISNULL(CONVERT(varchar, DateSinceLastLoss, 23), NULL) AS varchar) + '"' AS dateSinceLastLoss
      ,'"' + CAST(ISNULL(CONVERT(varchar, DateSinceLastLossS1, 23), NULL) AS varchar) + '"' AS dateSinceLastLossS1
      ,'"' + CAST(ISNULL(CONVERT(varchar, DateSinceLastLossS2, 23), NULL) AS varchar) + '"' AS dateSinceLastLossS2
      ,'"' + CAST(ISNULL(CONVERT(varchar, DateSinceLastLossS3, 23), NULL) AS varchar) + '"' AS dateSinceLastLossS3
      ,'"' + CAST(ISNULL(CONVERT(varchar, DateSinceLastLossS4, 23), NULL) AS varchar) + '"' AS dateSinceLastLossS4
	  ,'"' + CAST(TotalWinsAsFavourite AS varchar) + '"' AS totalWinsAsFavourite
      ,'"' + CAST(TotalWinsAsUnderdog AS varchar) + '"' AS totalWinsAsUnderdog
	  ,'"' + CAST(ploss.TotalLossesAsFavourite AS varchar) + '"' AS TotalLossesAsFavourite
      ,'"' + CAST(ploss.TotalLossesAsUnderdog AS varchar) + '"' AS TotalLossesAsUnderdog
	  ,'"' + CAST(CASE WHEN TotalWinsAsFavourite + ploss.TotalLossesAsFavourite > 0 THEN CAST(TotalWinsAsFavourite AS FLOAT) / (CAST(TotalWinsAsFavourite AS FLOAT) + CAST(ploss.TotalLossesAsFavourite AS FLOAT)) ELSE '' END AS varchar) + '"' AS winsAsFavouriteRatio
	  ,'"' + CAST(CASE WHEN TotalWinsAsFavourite + ploss.TotalLossesAsFavourite > 0 THEN CAST(ploss.TotalLossesAsFavourite AS FLOAT) / (CAST(TotalWinsAsFavourite AS FLOAT) + CAST(ploss.TotalLossesAsFavourite AS FLOAT)) ELSE '' END AS varchar) + '"' AS lossesAsFavouriteRatio
	  ,'"' + CAST(CASE WHEN TotalWinsAsUnderdog + ploss.TotalLossesAsUnderdog > 0 THEN CAST(TotalWinsAsUnderdog AS FLOAT) / (CAST(TotalWinsAsUnderdog AS FLOAT) + CAST(ploss.TotalLossesAsUnderdog AS FLOAT)) ELSE '' END AS varchar) + '"' AS winsAsUnderdogRatio
	  ,'"' + CAST(CASE WHEN TotalWinsAsUnderdog + ploss.TotalLossesAsUnderdog > 0 THEN CAST(ploss.TotalLossesAsUnderdog AS FLOAT) / (CAST(TotalWinsAsUnderdog AS FLOAT) + CAST(ploss.TotalLossesAsUnderdog AS FLOAT)) ELSE '' END AS varchar) + '"' AS lossesAsUnderdogRatio
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtWonAsFavourite * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtWonAsFavourite
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtWonAsUnderdog * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtWonAsUnderdog
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtLossAsFavourite * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtLossAsFavourite
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtLossAsUnderdog * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtLossAsUnderdog
	  ,'"' + CAST(TotalWinsAsFavouriteLastYear AS varchar) + '"' AS totalWinsAsFavouriteLastYear
      ,'"' + CAST(TotalWinsAsUnderdogLastYear AS varchar) + '"' AS totalWinsAsUnderdogLastYear
	  ,'"' + CAST(ploss.TotalLossesAsFavouriteLastYear AS varchar) + '"' AS TotalLossesAsFavouriteLastYear
      ,'"' + CAST(ploss.TotalLossesAsUnderdogLastYear AS varchar) + '"' AS TotalLossesAsUnderdogLastYear
	  ,'"' + CAST(CASE WHEN TotalWinsAsFavouriteLastYear + ploss.TotalLossesAsFavouriteLastYear > 0 THEN CAST(TotalWinsAsFavouriteLastYear AS FLOAT) / (CAST(TotalWinsAsFavouriteLastYear AS FLOAT) + CAST(ploss.TotalLossesAsFavouriteLastYear AS FLOAT)) ELSE '' END AS varchar) + '"' AS winsAsFavouriteLastYearRatio
	  ,'"' + CAST(CASE WHEN TotalWinsAsFavouriteLastYear + ploss.TotalLossesAsFavouriteLastYear > 0 THEN CAST(ploss.TotalLossesAsFavouriteLastYear AS FLOAT) / (CAST(TotalWinsAsFavouriteLastYear AS FLOAT) + CAST(ploss.TotalLossesAsFavouriteLastYear AS FLOAT)) ELSE '' END AS varchar) + '"' AS lossesAsFavouriteLastYearRatio
	  ,'"' + CAST(CASE WHEN TotalWinsAsUnderdogLastYear + ploss.TotalLossesAsUnderdogLastYear > 0 THEN CAST(TotalWinsAsUnderdogLastYear AS FLOAT) / (CAST(TotalWinsAsUnderdogLastYear AS FLOAT) + CAST(ploss.TotalLossesAsUnderdogLastYear AS FLOAT)) ELSE '' END AS varchar) + '"' AS winsAsUnderdogLastYearRatio
	  ,'"' + CAST(CASE WHEN TotalWinsAsUnderdogLastYear + ploss.TotalLossesAsUnderdogLastYear > 0 THEN CAST(ploss.TotalLossesAsUnderdogLastYear AS FLOAT) / (CAST(TotalWinsAsUnderdogLastYear AS FLOAT) + CAST(ploss.TotalLossesAsUnderdogLastYear AS FLOAT)) ELSE '' END AS varchar) + '"' AS lossesAsUnderdogLastYearRatio
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtWonAsFavouriteLastYear * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtWonAsFavouriteLastYear
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtWonAsUnderdogLastYear * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtWonAsUnderdogLastYear
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtLossAsFavouriteLastYear * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtLossAsFavouriteLastYear
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtLossAsUnderdogLastYear * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtLossAsUnderdogLastYear
	  ,'"' + CAST(TotalWinsAsFavouriteLastMonth AS varchar) + '"' AS totalWinsAsFavouriteLastMonth
      ,'"' + CAST(TotalWinsAsUnderdogLastMonth AS varchar) + '"' AS totalWinsAsUnderdogLastMonth
	  ,'"' + CAST(ploss.TotalLossesAsFavouriteLastMonth AS varchar) + '"' AS TotalLossesAsFavouriteLastMonth
      ,'"' + CAST(ploss.TotalLossesAsUnderdogLastMonth AS varchar) + '"' AS TotalLossesAsUnderdogLastMonth
	  ,'"' + CAST(CASE WHEN TotalWinsAsFavouriteLastMonth + ploss.TotalLossesAsFavouriteLastMonth > 0 THEN CAST(TotalWinsAsFavouriteLastMonth AS FLOAT) / (CAST(TotalWinsAsFavouriteLastMonth AS FLOAT) + CAST(ploss.TotalLossesAsFavouriteLastMonth AS FLOAT)) ELSE '' END AS varchar) + '"' AS winsAsFavouriteLastMonthRatio
	  ,'"' + CAST(CASE WHEN TotalWinsAsFavouriteLastMonth + ploss.TotalLossesAsFavouriteLastMonth > 0 THEN CAST(ploss.TotalLossesAsFavouriteLastMonth AS FLOAT) / (CAST(TotalWinsAsFavouriteLastMonth AS FLOAT) + CAST(ploss.TotalLossesAsFavouriteLastMonth AS FLOAT)) ELSE '' END AS varchar) + '"' AS lossesAsFavouriteLastMonthRatio
	  ,'"' + CAST(CASE WHEN TotalWinsAsUnderdogLastMonth + ploss.TotalLossesAsUnderdogLastMonth > 0 THEN CAST(TotalWinsAsUnderdogLastMonth AS FLOAT) / (CAST(TotalWinsAsUnderdogLastMonth AS FLOAT) + CAST(ploss.TotalLossesAsUnderdogLastMonth AS FLOAT)) ELSE '' END AS varchar) + '"' AS winsAsUnderdogLastMonthRatio
	  ,'"' + CAST(CASE WHEN TotalWinsAsUnderdogLastMonth + ploss.TotalLossesAsUnderdogLastMonth > 0 THEN CAST(ploss.TotalLossesAsUnderdogLastMonth AS FLOAT) / (CAST(TotalWinsAsUnderdogLastMonth AS FLOAT) + CAST(ploss.TotalLossesAsUnderdogLastMonth AS FLOAT)) ELSE '' END AS varchar) + '"' AS lossesAsUnderdogLastMonthRatio
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtWonAsFavouriteLastMonth * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtWonAsFavouriteLastMonth
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtWonAsUnderdogLastMonth * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtWonAsUnderdogLastMonth
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtLossAsFavouriteLastMonth * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtLossAsFavouriteLastMonth
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtLossAsUnderdogLastMonth * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtLossAsUnderdogLastMonth
	  ,'"' + CAST(TotalWinsAsFavouriteLastWeek AS varchar) + '"' AS totalWinsAsFavouriteLastWeek
      ,'"' + CAST(TotalWinsAsUnderdogLastWeek AS varchar) + '"' AS totalWinsAsUnderdogLastWeek
	  ,'"' + CAST(ploss.TotalLossesAsFavouriteLastWeek AS varchar) + '"' AS TotalLossesAsFavouriteLastWeek
      ,'"' + CAST(ploss.TotalLossesAsUnderdogLastWeek AS varchar) + '"' AS TotalLossesAsUnderdogLastWeek
	  ,'"' + CAST(CASE WHEN TotalWinsAsFavouriteLastWeek + ploss.TotalLossesAsFavouriteLastWeek > 0 THEN CAST(TotalWinsAsFavouriteLastWeek AS FLOAT) / (CAST(TotalWinsAsFavouriteLastWeek AS FLOAT) + CAST(ploss.TotalLossesAsFavouriteLastWeek AS FLOAT)) ELSE '' END AS varchar) + '"' AS winsAsFavouriteLastWeekRatio
	  ,'"' + CAST(CASE WHEN TotalWinsAsFavouriteLastWeek + ploss.TotalLossesAsFavouriteLastWeek > 0 THEN CAST(ploss.TotalLossesAsFavouriteLastWeek AS FLOAT) / (CAST(TotalWinsAsFavouriteLastWeek AS FLOAT) + CAST(ploss.TotalLossesAsFavouriteLastWeek AS FLOAT)) ELSE '' END AS varchar) + '"' AS lossesAsFavouriteLastWeekRatio
	  ,'"' + CAST(CASE WHEN TotalWinsAsUnderdogLastWeek + ploss.TotalLossesAsUnderdogLastWeek > 0 THEN CAST(TotalWinsAsUnderdogLastWeek AS FLOAT) / (CAST(TotalWinsAsUnderdogLastWeek AS FLOAT) + CAST(ploss.TotalLossesAsUnderdogLastWeek AS FLOAT)) ELSE '' END AS varchar) + '"' AS winsAsUnderdogLastWeekRatio
	  ,'"' + CAST(CASE WHEN TotalWinsAsUnderdogLastWeek + ploss.TotalLossesAsUnderdogLastWeek > 0 THEN CAST(ploss.TotalLossesAsUnderdogLastWeek AS FLOAT) / (CAST(TotalWinsAsUnderdogLastWeek AS FLOAT) + CAST(ploss.TotalLossesAsUnderdogLastWeek AS FLOAT)) ELSE '' END AS varchar) + '"' AS lossesAsUnderdogLastWeekRatio
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtWonAsFavouriteLastWeek * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtWonAsFavouriteLastWeek
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtWonAsUnderdogLastWeek * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtWonAsUnderdogLastWeek
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtLossAsFavouriteLastWeek * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtLossAsFavouriteLastWeek
	  ,'"' + CAST(ISNULL(LTRIM(REPLACE(STR(AverageWinningProbabilityAtLossAsUnderdogLastWeek * 100.0, 10, 2), ',', '.')), NULL) AS varchar) + '"' AS averageWinningProbabilityAtLossAsUnderdogLastWeek
      ,'"' + CAST(Streak AS varchar) + '"' AS streak
      ,'"' + CAST(StreakS1 AS varchar) + '"' AS streakS1
      ,'"' + CAST(StreakS2 AS varchar) + '"' AS streakS2
      ,'"' + CAST(StreakS3 AS varchar) + '"' AS streakS3
      ,'"' + CAST(StreakS4 AS varchar) + '"' AS streakS4
    FROM Player p
    LEFT JOIN Country c ON p.CountryTPId = c.CountryTPId
    LEFT JOIN Plays ps ON ps.PlaysId = p.PlaysId
    LEFT JOIN PlayerTSCareerAvg tsavg ON tsavg.PlayerTPId = p.PlayerTPId
    LEFT JOIN RecentMatchPlayers rmp ON rmp.PlayerTPId = p.PlayerTPId
	LEFT JOIN FinalPlayerTournamentType fptt ON p.PlayerTPId = fptt.PlayerTPId
	LEFT JOIN TournamentType tt ON tt.TournamentTypeId = fptt.TournamentTypeId
	LEFT JOIN PlayerLossStatsFromLastMatch ploss ON p.PlayerTPId = ploss.PlayerTPId
    WHERE rmp.PlayerTPId IS NOT NULL AND
	p.PlayerTPId in 
	(select distinct p.pid from
	(
		select distinct(m.Player1TPId) as pid from Match m WHERE m.DateTime >= '2022-01-01' AND m.Result in ('20', '21', '30', '31', '32')
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
playerHeight,
playerWeight,
playerTurnedPro,
playsId,
plays,
playerTournamentTypeId,
playerTournamentType,
winRatio,
matches,
trueSkillMean,
careerTrueSkillMean,
trueSkillMeanM,
trueSkillStandardDeviationM,
trueSkillMeanSM,
trueSkillStandardDeviationSM,
trueSkillMeanGSM,
trueSkillStandardDeviationGSM,
trueSkillMeanMS1,
trueSkillStandardDeviationMS1,
TrueSkillMeanSMS1,
trueSkillStandardDeviationSMS1,
TrueSkillMeanGSMS1,
trueSkillStandardDeviationGSMS1,
TrueSkillMeanMS2,
trueSkillStandardDeviationMS2,
TrueSkillMeanSMS2,
trueSkillStandardDeviationSMS2,
TrueSkillMeanGSMS2,
trueSkillStandardDeviationGSMS2,
TrueSkillMeanMS3,
trueSkillStandardDeviationMS3,
TrueSkillMeanSMS3,
trueSkillStandardDeviationSMS3,
TrueSkillMeanGSMS3,
trueSkillStandardDeviationGSMS3,
TrueSkillMeanMS4,
trueSkillStandardDeviationMS4,
TrueSkillMeanSMS4,
trueSkillStandardDeviationSMS4,
TrueSkillMeanGSMS4,
trueSkillStandardDeviationGSMS4,
matchesTotal,
matchesWinRatio,
matchesLossRatio,
winsTotal,
lossesTotal,
matchesLastYear,
matchesLastYearWinRatio,
matchesLastYearLossRatio,
winsLastYear,
lossesLastYear,
matchesLastMonth,
matchesLastMonthWinRatio,
matchesLastMonthLossRatio,
winsLastMonth,
lossesLastMonth,
matchesLastWeek,
matchesLastWeekWinRatio,
matchesLastWeekLossRatio,
winsLastWeek,
lossesLastWeek,
matchesTotalS1,
matchesTotalS1WinRatio,
matchesTotalS1LossRatio,
winsTotalS1,
lossesTotalS1,
matchesLastYearS1,
matchesLastYearS1WinRatio,
matchesLastYearS1LossRatio,
winsLastYearS1,
lossesLastYearS1,
matchesLastMonthS1,
matchesLastMonthS1WinRatio,
matchesLastMonthS1LossRatio,
winsLastMonthS1,
lossesLastMonthS1,
matchesLastWeekS1,
matchesLastWeekS1WinRatio,
matchesLastWeekS1LossRatio,
winsLastWeekS1,
lossesLastWeekS1,
matchesTotalS2,
matchesTotalS2WinRatio,
matchesTotalS2LossRatio,
winsTotalS2,
lossesTotalS2,
matchesLastYearS2,
matchesLastYearS2WinRatio,
matchesLastYearS2LossRatio,
winsLastYearS2,
lossesLastYearS2,
matchesLastMonthS2,
matchesLastMonthS2WinRatio,
matchesLastMonthS2LossRatio,
winsLastMonthS2,
lossesLastMonthS2,
matchesLastWeekS2,
matchesLastWeekS2WinRatio,
matchesLastWeekS2LossRatio,
winsLastWeekS2,
lossesLastWeekS2,
matchesTotalS3,
matchesTotalS3WinRatio,
matchesTotalS3LossRatio,
winsTotalS3,
lossesTotalS3,
matchesLastYearS3,
matchesLastYearS3WinRatio,
matchesLastYearS3LossRatio,
winsLastYearS3,
lossesLastYearS3,
matchesLastMonthS3,
matchesLastMonthS3WinRatio,
matchesLastMonthS3LossRatio,
winsLastMonthS3,
lossesLastMonthS3,
matchesLastWeekS3,
matchesLastWeekS3WinRatio,
matchesLastWeekS3LossRatio,
winsLastWeekS3,
lossesLastWeekS3,
matchesTotalS4,
matchesTotalS4WinRatio,
matchesTotalS4LossRatio,
winsTotalS4,
lossesTotalS4,
matchesLastYearS4,
matchesLastYearS4WinRatio,
matchesLastYearS4LossRatio,
winsLastYearS4,
lossesLastYearS4,
matchesLastMonthS4,
matchesLastMonthS4WinRatio,
matchesLastMonthS4LossRatio,
winsLastMonthS4,
lossesLastMonthS4,
matchesLastWeekS4,
matchesLastWeekS4WinRatio,
matchesLastWeekS4LossRatio,
winsLastWeekS4,
lossesLastWeekS4,
setsTotal,
setsWinRatio,
setsLossRatio,
winsSetsTotal,
lossesSetsTotal,
setsLastYear,
setsLastYearWinRatio,
setsLastYearLossRatio,
winsSetsLastYear,
lossesSetsLastYear,
setsLastMonth,
setsLastMonthWinRatio,
setsLastMonthLossRatio,
winsSetsLastMonth,
lossesSetsLastMonth,
setsLastWeek,
setsLastWeekWinRatio,
setsLastWeekLossRatio,
winsSetsLastWeek,
lossesSetsLastWeek,
setsTotalS1,
setsTotalS1WinRatio,
setsTotalS1LossRatio,
winsSetsTotalS1,
lossesSetsTotalS1,
setsLastYearS1,
setsLastYearS1WinRatio,
setsLastYearS1LossRatio,
winsSetsLastYearS1,
lossesSetsLastYearS1,
setsLastMonthS1,
setsLastMonthS1WinRatio,
setsLastMonthS1LossRatio,
winsSetsLastMonthS1,
lossesSetsLastMonthS1,
setsLastWeekS1,
setsLastWeekS1WinRatio,
setsLastWeekS1LossRatio,
winsSetsLastWeekS1,
lossesSetsLastWeekS1,
setsTotalS2,
setsTotalS2WinRatio,
setsTotalS2LossRatio,
winsSetsTotalS2,
lossesSetsTotalS2,
setsLastYearS2,
setsLastYearS2WinRatio,
setsLastYearS2LossRatio,
winsSetsLastYearS2,
lossesSetsLastYearS2,
setsLastMonthS2,
setsLastMonthS2WinRatio,
setsLastMonthS2LossRatio,
winsSetsLastMonthS2,
lossesSetsLastMonthS2,
setsLastWeekS2,
setsLastWeekS2WinRatio,
setsLastWeekS2LossRatio,
winsSetsLastWeekS2,
lossesSetsLastWeekS2,
setsTotalS3,
setsTotalS3WinRatio,
setsTotalS3LossRatio,
winsSetsTotalS3,
lossesSetsTotalS3,
setsLastYearS3,
setsLastYearS3WinRatio,
setsLastYearS3LossRatio,
winsSetsLastYearS3,
lossesSetsLastYearS3,
setsLastMonthS3,
setsLastMonthS3WinRatio,
setsLastMonthS3LossRatio,
winsSetsLastMonthS3,
lossesSetsLastMonthS3,
setsLastWeekS3,
setsLastWeekS3WinRatio,
setsLastWeekS3LossRatio,
winsSetsLastWeekS3,
lossesSetsLastWeekS3,
setsTotalS4,
setsTotalS4WinRatio,
setsTotalS4LossRatio,
winsSetsTotalS4,
lossesSetsTotalS4,
setsLastYearS4,
setsLastYearS4WinRatio,
setsLastYearS4LossRatio,
winsSetsLastYearS4,
lossesSetsLastYearS4,
setsLastMonthS4,
setsLastMonthS4WinRatio,
setsLastMonthS4LossRatio,
winsSetsLastMonthS4,
lossesSetsLastMonthS4,
setsLastWeekS4,
setsLastWeekS4WinRatio,
setsLastWeekS4LossRatio,
winsSetsLastWeekS4,
lossesSetsLastWeekS4,
gamesTotal,
gamesWinRatio,
gamesLossRatio,
winsGamesTotal,
lossesGamesTotal,
gamesLastYear,
gamesLastYearWinRatio,
gamesLastYearLossRatio,
winsGamesLastYear,
lossesGamesLastYear,
gamesLastMonth,
gamesLastMonthWinRatio,
gamesLastMonthLossRatio,
winsGamesLastMonth,
lossesGamesLastMonth,
gamesLastWeek,
gamesLastWeekWinRatio,
gamesLastWeekLossRatio,
winsGamesLastWeek,
lossesGamesLastWeek,
gamesTotalS1,
gamesTotalS1WinRatio,
gamesTotalS1LossRatio,
winsGamesTotalS1,
lossesGamesTotalS1,
gamesLastYearS1,
gamesLastYearS1WinRatio,
gamesLastYearS1LossRatio,
winsGamesLastYearS1,
lossesGamesLastYearS1,
gamesLastMonthS1,
gamesLastMonthS1WinRatio,
gamesLastMonthS1LossRatio,
winsGamesLastMonthS1,
lossesGamesLastMonthS1,
gamesLastWeekS1,
gamesLastWeekS1WinRatio,
gamesLastWeekS1LossRatio,
winsGamesLastWeekS1,
lossesGamesLastWeekS1,
gamesTotalS2,
gamesTotalS2WinRatio,
gamesTotalS2LossRatio,
winsGamesTotalS2,
lossesGamesTotalS2,
gamesLastYearS2,
gamesLastYearS2WinRatio,
gamesLastYearS2LossRatio,
winsGamesLastYearS2,
lossesGamesLastYearS2,
gamesLastMonthS2,
gamesLastMonthS2WinRatio,
gamesLastMonthS2LossRatio,
winsGamesLastMonthS2,
lossesGamesLastMonthS2,
gamesLastWeekS2,
gamesLastWeekS2WinRatio,
gamesLastWeekS2LossRatio,
winsGamesLastWeekS2,
lossesGamesLastWeekS2,
gamesTotalS3,
gamesTotalS3WinRatio,
gamesTotalS3LossRatio,
winsGamesTotalS3,
lossesGamesTotalS3,
gamesLastYearS3,
gamesLastYearS3WinRatio,
gamesLastYearS3LossRatio,
winsGamesLastYearS3,
lossesGamesLastYearS3,
gamesLastMonthS3,
gamesLastMonthS3WinRatio,
gamesLastMonthS3LossRatio,
winsGamesLastMonthS3,
lossesGamesLastMonthS3,
gamesLastWeekS3,
gamesLastWeekS3WinRatio,
gamesLastWeekS3LossRatio,
winsGamesLastWeekS3,
lossesGamesLastWeekS3,
gamesTotalS4,
gamesTotalS4WinRatio,
gamesTotalS4LossRatio,
winsGamesTotalS4,
lossesGamesTotalS4,
gamesLastYearS4,
gamesLastYearS4WinRatio,
gamesLastYearS4LossRatio,
winsGamesLastYearS4,
lossesGamesLastYearS4,
gamesLastMonthS4,
gamesLastMonthS4WinRatio,
gamesLastMonthS4LossRatio,
winsGamesLastMonthS4,
lossesGamesLastMonthS4,
gamesLastWeekS4,
gamesLastWeekS4WinRatio,
gamesLastWeekS4LossRatio,
winsGamesLastWeekS4,
lossesGamesLastWeekS4,
dateSinceLastWin,
dateSinceLastWinS1,
dateSinceLastWinS2,
dateSinceLastWinS3,
dateSinceLastWinS4,
dateSinceLastLoss,
dateSinceLastLossS1,
dateSinceLastLossS2,
dateSinceLastLossS3,
dateSinceLastLossS4,
totalWinsAsFavourite,
totalWinsAsUnderdog,
TotalLossesAsFavourite,
TotalLossesAsUnderdog,
winsAsFavouriteRatio,
lossesAsFavouriteRatio,
winsAsUnderdogRatio,
lossesAsUnderdogRatio,
averageWinningProbabilityAtWonAsFavourite,
averageWinningProbabilityAtWonAsUnderdog,
averageWinningProbabilityAtLossAsFavourite,
averageWinningProbabilityAtLossAsUnderdog,
totalWinsAsFavouriteLastYear,
totalWinsAsUnderdogLastYear,
TotalLossesAsFavouriteLastYear,
TotalLossesAsUnderdogLastYear,
winsAsFavouriteLastYearRatio,
lossesAsFavouriteLastYearRatio,
winsAsUnderdogLastYearRatio,
lossesAsUnderdogLastYearRatio,
averageWinningProbabilityAtWonAsFavouriteLastYear,
averageWinningProbabilityAtWonAsUnderdogLastYear,
averageWinningProbabilityAtLossAsFavouriteLastYear,
averageWinningProbabilityAtLossAsUnderdogLastYear,
totalWinsAsFavouriteLastMonth,
totalWinsAsUnderdogLastMonth,
TotalLossesAsFavouriteLastMonth,
TotalLossesAsUnderdogLastMonth,
winsAsFavouriteLastMonthRatio,
lossesAsFavouriteLastMonthRatio,
winsAsUnderdogLastMonthRatio,
lossesAsUnderdogLastMonthRatio,
averageWinningProbabilityAtWonAsFavouriteLastMonth,
averageWinningProbabilityAtWonAsUnderdogLastMonth,
averageWinningProbabilityAtLossAsFavouriteLastMonth,
averageWinningProbabilityAtLossAsUnderdogLastMonth,
totalWinsAsFavouriteLastWeek,
totalWinsAsUnderdogLastWeek,
TotalLossesAsFavouriteLastWeek,
TotalLossesAsUnderdogLastWeek,
winsAsFavouriteLastWeekRatio,
lossesAsFavouriteLastWeekRatio,
winsAsUnderdogLastWeekRatio,
lossesAsUnderdogLastWeekRatio,
averageWinningProbabilityAtWonAsFavouriteLastWeek,
averageWinningProbabilityAtWonAsUnderdogLastWeek,
averageWinningProbabilityAtLossAsFavouriteLastWeek,
averageWinningProbabilityAtLossAsUnderdogLastWeek,
streak,
streakS1,
streakS2,
streakS3,
streakS4
from PlayerData;