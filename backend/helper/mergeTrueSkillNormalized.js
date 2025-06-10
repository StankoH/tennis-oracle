export function mergeAndNormalizeTrueSkillHistory(
    player1History,
    player2History,
    matchDateISO = null        // 🆕
  ) {
    const map1 = new Map();
    const map2 = new Map();
  
    for (const e of player1History)
      map1.set(e.dateTime.substring(0, 10), e.mean);
  
    for (const e of player2History)
      map2.set(e.dateTime.substring(0, 10), e.mean);
  
    const allDates = [...map1.keys(), ...map2.keys()].sort();
    const minDate  = allDates[0];
    const lastHist = allDates[allDates.length - 1];
  
    // ➜ DO KOJEG DATUMA GURAŠ?
    const endISO = matchDateISO && matchDateISO > lastHist ? matchDateISO : lastHist;
  
    const result = [];
    let current   = new Date(minDate);
    const endDate = new Date(endISO);
  
    let lastP1 = 25;
    let lastP2 = 25;
  
    while (current <= endDate) {
      const iso = current.toISOString().substring(0, 10);
  
      if (map1.has(iso)) lastP1 = map1.get(iso);
      if (map2.has(iso)) lastP2 = map2.get(iso);
  
      result.push({
        dateTime: iso,
        player1: { mean: lastP1 },
        player2: { mean: lastP2 }
      });
  
      current.setDate(current.getDate() + 1);
    }
    return result;
  }  