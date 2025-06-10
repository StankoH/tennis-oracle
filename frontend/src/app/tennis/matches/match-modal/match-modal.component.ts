import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { BaseChartDirective } from 'ng2-charts';
import { DetailedMatch, Match } from '../../tennis.model';
import { MatchService } from '../match.service';

type ScopeKey = 'Matches' | 'Sets' | 'Games';
type MetricKey = 'Matches' | 'Wins' | 'Losses' | 'WinRatio';
type RangeKey = 'all' | 'year' | 'month' | 'week';

Chart.register(...registerables, annotationPlugin);

@Component({
  selector: 'app-match-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './match-modal.component.html',
  styleUrl: './match-modal.component.scss'
})
export class MatchModalComponent implements OnInit {
  @Input() match!: Match;
  @Output() closed = new EventEmitter<void>();

  performanceSurface = 'all';
  activeTab = 'Summary';
  tabs: string[] = ['Summary', 'TS Breakdown', 'Win Probability Breakdown', 'TrueSkill', 'Performance', 'Set Performance', 'Game Performance', 'Expectation Performance', 'Streak Info', 'H2H'];
  metrics: MetricKey[] = ['Matches', 'Wins', 'Losses', 'WinRatio'];
  rangeOptions: RangeKey[] = ['all', 'year', 'month', 'week'];
  trueSkillHistoryPlayer1: { dateTime: string, mean: number }[] = [];
  trueSkillHistoryPlayer2: { dateTime: string, mean: number }[] = [];

  performanceRanges: Record<ScopeKey, RangeKey> = {
    Matches: 'all',
    Sets: 'all',
    Games: 'all'
  };

  summaryData: DetailedMatch | null = null;
  loadingDetails = true;
  errorLoading = false;
  performanceMetrics: unknown;

  h2hGranularity: 'M' | 'SM' | 'GSM' = 'M';
  h2hMetrics: (
    | 'TrueSkillMean'
    | 'TrueSkillStandardDeviation'
    | 'TrueSkillMeanOld'
    | 'TrueSkillStandardDeviationOld'
    | 'WinProbability'
  )[] = [
      'TrueSkillMean',
      'TrueSkillStandardDeviation',
      'TrueSkillMeanOld',
      'TrueSkillStandardDeviationOld',
      'WinProbability',
    ];

  metricLabelMap: Record<string, string> = {
    TrueSkillMean: 'TrueSkill (Current)',
    TrueSkillStandardDeviation: 'SD (Current)',
    TrueSkillMeanOld: 'TrueSkill (Previous)',
    TrueSkillStandardDeviationOld: 'SD (Previous)',
    WinProbability: 'Win Probability',
  };

  lineChartData: ChartData<'line'>['datasets'] = [
    { data: [], label: 'Player 1', fill: false },
    { data: [], label: 'Player 2', fill: false }
  ];

  lineChartLabels: string[] = [];

  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        title: {
          display: true,
          text: 'TrueSkill Mean'
        },
        suggestedMin: 15,
        suggestedMax: 35
      }
    }
  };

  winProbChartData: ChartData<'line'>['datasets'] = [
    {
      data: [], label: 'Player 1 Win Probability', borderColor: 'green', fill: false
    },
    {
      data: [], label: 'Player 2 Win Probability', borderColor: 'orange', fill: false
    }
  ];

  winProbChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Win Probability'
        },
        min: 0,
        max: 100
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  constructor(private matchService: MatchService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    if (!this.match?._id) return;

    this.matchService.getMatchDetails(this.match._id).subscribe({
      next: (data) => {
        this.summaryData = data;
        this.performanceSurface = this.summaryData?.surfaceId?.toString() || 'all';
        this.loadingDetails = false;

        const p1 = this.summaryData.player1TPId;
        const p2 = this.summaryData.player2TPId;

        if (!p1 || !p2) return;

        this.matchService.getMergedTrueSkillHistory(p1, p2).subscribe({
          next: (merged) => {
            if (!Array.isArray(merged) || merged.length === 0) {
              console.warn('⚠️ Nema validnih TS podataka za prikaz.');
              return;
            }

            /* ----------  LABELS  ---------- */
            this.lineChartLabels = merged.map(entry =>
              new Date(entry.dateTime).toLocaleDateString()
            );
            const matchDate = new Date(this.match!.dateTime).toLocaleDateString();

            /* ----------  TREND DATA  ---------- */
            const trendDataPlayer1 = this.calculateLinearTrend(
              merged.map(e => e.player1?.mean ?? 25)
            );
            const trendDataPlayer2 = this.calculateLinearTrend(
              merged.map(e => e.player2?.mean ?? 25)
            );

            /* ----------  WIN-PROB OVER TIME  ---------- */
            const winProbOverTime = merged.map(entry => {
              const a = { mean: entry.player1?.mean ?? 25, sd: entry.player1?.sd ?? 8.333 };
              const b = { mean: entry.player2?.mean ?? 25, sd: entry.player2?.sd ?? 8.333 };
              return this.getWinProbability(a.mean, a.sd, b.mean, b.sd);
            });

            const trendWP1 = this
              .calculateLinearTrend(winProbOverTime)
              .map(v => Math.round(v * 100) / 100);
            const trendWP2 = trendWP1.map(v => Math.round((100 - v) * 100) / 100);

            /* ----------  ANNOTATION (match date)  ---------- */
            const matchLineAnnotation = {
              type: 'line',
              xMin: matchDate,
              xMax: matchDate,
              borderColor: 'rgba(128,128,128,0.7)',
              borderWidth: 2,
              borderDash: [2, 2],
              label: {
                display: true,
                content: 'Match Date',
                position: 'start',
                backgroundColor: '#fff',
                color: '#333',
                font: { style: 'italic', weight: 'normal' },
                padding: 0
              }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.lineChartOptions.plugins as any).annotation =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (this.winProbChartOptions.plugins as any).annotation = {
                annotations: { matchLine: matchLineAnnotation }
              };

            /* ----------  DATASETS  ---------- */
            this.lineChartData = [
              {
                data: merged.map(e => e.player1?.mean ?? 25),
                label: this.summaryData?.player1Name || 'Player 1',
                borderColor: 'rgba(255, 0, 0, 1)',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderWidth: 2, tension: 0.6, fill: false,
                pointRadius: 0, pointHoverRadius: 0
              },
              {
                data: merged.map(e => e.player2?.mean ?? 25),
                label: this.summaryData?.player2Name || 'Player 2',
                borderColor: 'rgba(0, 0, 255, 1)',
                backgroundColor: 'rgba(0, 0, 255, 0.1)',
                borderWidth: 2, tension: 0.6, fill: false,
                pointRadius: 0, pointHoverRadius: 0
              },
              {
                data: trendDataPlayer1,
                label: `${this.summaryData?.player1Name || 'Player 1'} Trend`,
                borderColor: 'rgba(0,0,0,0.5)', borderDash: [2, 2],
                borderWidth: 2.5, fill: false, pointRadius: 0, pointHoverRadius: 0
              },
              {
                data: trendDataPlayer2,
                label: `${this.summaryData?.player2Name || 'Player 2'} Trend`,
                borderColor: 'rgba(0,0,0,0.5)', borderDash: [2, 2],
                borderWidth: 2.5, fill: false, pointRadius: 0, pointHoverRadius: 0
              }
            ];

            this.winProbChartData = [
              {
                data: winProbOverTime,
                label: `${this.summaryData?.player1Name || 'Player 1'} Win Probability`,
                borderColor: 'rgba(255, 0, 0, 1)',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                tension: 0.4, pointRadius: 0, fill: false
              },
              {
                data: winProbOverTime.map(p => 100 - p),
                label: `${this.summaryData?.player2Name || 'Player 2'} Win Probability`,
                borderColor: 'rgba(0, 0, 255, 1)',
                backgroundColor: 'rgba(0, 0, 255, 0.1)',
                tension: 0.4, pointRadius: 0, fill: false
              },
              {
                data: trendWP1,
                label: `${this.summaryData?.player1Name || 'Player 1'} WP Trend`,
                borderColor: 'rgba(0,0,0,0.5)', borderDash: [2, 2],
                borderWidth: 2.5, fill: false, pointRadius: 0, pointHoverRadius: 0
              },
              {
                data: trendWP2,
                label: `${this.summaryData?.player2Name || 'Player 2'} WP Trend`,
                borderColor: 'rgba(0,0,0,0.5)', borderDash: [2, 2],
                borderWidth: 2.5, fill: false, pointRadius: 0, pointHoverRadius: 0
              }
            ];

            /* ----------  DYNAMIC Y-RANGE : TS  ---------- */
            const tsAll = [
              ...merged.map(e => e.player1?.mean ?? 25),
              ...merged.map(e => e.player2?.mean ?? 25)
            ];
            this.lineChartOptions.scales!['y']!.min = Math.floor(Math.min(...tsAll));
            this.lineChartOptions.scales!['y']!.max = Math.ceil(Math.max(...tsAll));

            /* ----------  DYNAMIC Y-RANGE : WIN PROB   🆕 ---------- */
            const wpAll = [
              ...winProbOverTime,
              ...winProbOverTime.map(p => 100 - p),
              ...trendWP1, ...trendWP2
            ];

            const rawMin = Math.min(...wpAll);
            const rawMax = Math.max(...wpAll);
            let yMin = Math.max(0, Math.floor(rawMin) - 1);   // buffer −5 p.p.
            let yMax = Math.min(100, Math.ceil(rawMax) + 0); // buffer +5 p.p.

            // 🆕 safety-net: minimal height 10 p.p.
            if (yMax - yMin < 10) {
              const mid = (yMax + yMin) / 2;
              yMin = Math.max(0, Math.floor(mid - 0));
              yMax = Math.min(100, Math.ceil(mid + 0));
            }

            this.winProbChartOptions.scales!['y']!.min = yMin; // 🆕
            this.winProbChartOptions.scales!['y']!.max = yMax; // 🆕

            /* ----------  FINISH  ---------- */
            this.cdr.detectChanges();  // osvježi view
          },
          error: err => console.error('❌ Greška kod dohvaćanja merged TS:', err)
        });
      },
      error: () => {
        this.errorLoading = true;
        this.loadingDetails = false;
      }
    });
  }


  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  close(): void {
    this.closed.emit();
  }

  formatOdds(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return '-';
    return value.toFixed(2);
  }

  formatPercent(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return '-';
    return (value * 100).toFixed(2) + '%';
  }

  getRangeLabel(range: RangeKey): string {
    return range === 'all' ? 'All Matches' : `Last ${range}`;
  }

  setPerformanceRange(scope: ScopeKey, value: string): void {
    const validValues: RangeKey[] = ['all', 'year', 'month', 'week'];
    if (validValues.includes(value as RangeKey)) {
      this.performanceRanges[scope] = value as RangeKey;
    } else {
      console.warn('[setPerformanceRange] Invalid range value:', value);
    }
  }

  getPerformanceRange(scope: ScopeKey): RangeKey {
    return this.performanceRanges[scope];
  }

  getPerformanceValue(details: DetailedMatch, player: number, metric: MetricKey, scope: ScopeKey = 'Matches'): number {
    const rangeMap: Record<RangeKey, string> = {
      all: 'Total',
      year: 'LastYear',
      month: 'LastMonth',
      week: 'LastWeek'
    };
    const range = this.performanceRanges[scope];
    const rangeSuffix = rangeMap[range];
    const surfaceSuffix = this.performanceSurface !== 'all' ? `S${this.performanceSurface}` : '';
    const baseKey = `player${player}`;
    let key: string;
    const data = details as unknown as Record<string, unknown>;

    if (metric === 'WinRatio') {
      const winsKey = scope === 'Matches'
        ? `${baseKey}Wins${rangeSuffix}${surfaceSuffix}`
        : `${baseKey}Wins${scope}${rangeSuffix}${surfaceSuffix}`;

      const matchesKey = scope === 'Matches'
        ? `${baseKey}Matches${rangeSuffix}${surfaceSuffix}`
        : `${baseKey}${scope}${rangeSuffix}${surfaceSuffix}`;

      const rawWins = data[winsKey];
      const rawMatches = data[matchesKey];
      const wins = typeof rawWins === 'string' ? parseInt(rawWins.replace(/,/g, ''), 10) : (rawWins as number) ?? 0;
      const matches = typeof rawMatches === 'string' ? parseInt(rawMatches.replace(/,/g, ''), 10) : (rawMatches as number) ?? 0;
      const winRatio = matches > 0 ? Math.round((wins / matches) * 10000) / 100 : 0;
      // console.log('[CALCULATED WinRatio]', { winsKey, matchesKey, wins, matches, winRatio });
      return winRatio;
    }

    if (scope === 'Matches') {
      key = `${baseKey}${metric}${rangeSuffix}${surfaceSuffix}`;
    } else {
      key = metric === 'Matches'
        ? `${baseKey}${scope}${rangeSuffix}${surfaceSuffix}`
        : `${baseKey}${metric}${scope}${rangeSuffix}${surfaceSuffix}`;
    }

    const rawValue = data[key];
    const value = typeof rawValue === 'string' ? parseInt(rawValue.replace(/,/g, ''), 10) : (rawValue as number) ?? 0;
    // console.log('[getPerformanceValue]', { key, value });
    return value;
  }

  getValue(details: DetailedMatch, base: string, player = 1): number {
    const rangeMap: Record<RangeKey, string> = {
      all: '',
      year: 'LastYear',
      month: 'LastMonth',
      week: 'LastWeek'
    };
    const suffix = rangeMap[this.getPerformanceRange('Matches')];
    const key = `player${player}${base}${suffix}`;
    const data = details as unknown as Record<string, unknown>;
    const rawValue = data[key];
    const value = typeof rawValue === 'string' ? parseFloat(rawValue.replace(/,/g, '')) : (rawValue as number) ?? 0;
    // console.log('[getValue]', { key, value });
    return value;
  }

  getStreak(details: DetailedMatch, base: string, player = 1): number {
    const baseKey = `player${player}${base}`;
    const suffix = this.performanceSurface !== 'all' ? `S${this.performanceSurface}` : '';
    const key = baseKey + suffix;
    const data = details as unknown as Record<string, unknown>;
    const rawValue = data[key];
    const value = typeof rawValue === 'string' ? parseFloat(rawValue.replace(/,/g, '')) : (rawValue as number) ?? 0;
    // console.log('[getStreak]', { key, value });
    return value;
  }

  getH2HValue(
    details: DetailedMatch,
    metric: 'TrueSkillMean' | 'TrueSkillStandardDeviation' | 'TrueSkillMeanOld' | 'TrueSkillStandardDeviationOld' | 'WinProbability',
    player: 1 | 2
  ): number {
    const surfaceSuffix = this.performanceSurface !== 'all' ? 'S' + this.performanceSurface : '';
    const gran = this.h2hGranularity;
    const key = metric === 'WinProbability'
      ? `winProbabilityplayer${player}H2H${gran}${surfaceSuffix}`
      : `player${player}H2H${metric}${gran}${surfaceSuffix}`;

    const data = details as unknown as Record<string, unknown>;
    const raw = data[key];
    return typeof raw === 'string' ? parseFloat(raw.replace(/,/g, '')) : (raw as number) ?? 0;
  }

  getH2HWins(player: 1 | 2): number {
    const data = this.summaryData as unknown as Record<string, unknown>;
    const key = `player${player}H2H`;
    const raw = data[key];
    return typeof raw === 'string' ? parseFloat(raw.replace(/,/g, '')) : (raw as number) ?? 0;
  }

  calculateLinearTrend(values: number[]): number[] {
    const n = values.length;
    const xVals = [...Array(n).keys()];
    const sumX = xVals.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = xVals.reduce((acc, x, i) => acc + x * values[i], 0);
    const sumX2 = xVals.reduce((acc, x) => acc + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return xVals.map(x => slope * x + intercept);
  }

  normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  getWinProbability(meanA: number, sdA: number, meanB: number, sdB: number): number {
    const beta = 4.1667; // tipično za TrueSkill, 25 / 6
    const denominator = Math.sqrt(2 * beta * beta + sdA * sdA + sdB * sdB);
    const deltaMu = meanA - meanB;
    const prob = this.normalCDF(deltaMu / denominator);
    return Math.round(prob * 10000) / 100; // zaokruži na 2 decimale
  }

  /** Public helper za templatu */
  getWpColor(prob?: number): string {
    const p = prob ?? 50;                     // default 50 %
    const clamp = Math.max(0, Math.min(100, p));

    // ispod 50 % → crvena ↔︎ crna
    if (clamp < 50) {
      const t = clamp / 50;                   // 0 → 1
      return this.mix('#e53935', '#222222', t);
    }

    // iznad 50 % → crna ↔︎ zelena
    const t = (clamp - 50) / 50;              // 0 → 1
    return this.mix('#222222', '#43a047', t);
  }

  /* ----------  Private utili  ---------- */

  /** 3- ili 6-znak HEX (#f00 / #ff0000) → RGB tuple */
  private hexToRgb(hex: string): [number, number, number] {
    hex = hex.replace('#', '');
    if (hex.length === 3) {                   // #f00 → #ff0000
      hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  /** RGB → 6-znak HEX (#aabbcc) */
  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (v: number) => v.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /** Linearna interpolacija dviju HEX boja, t∈[0,1] */
  private mix(c1: string, c2: string, t: number): string {
    const [r1, g1, b1] = this.hexToRgb(c1);
    const [r2, g2, b2] = this.hexToRgb(c2);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return this.rgbToHex(r, g, b);
  }

  /* ----------  Odds → boja  ---------- */
  getOddsColor(odds: number | undefined,
    otherOdds: number | undefined): string {

    if (!odds || !otherOdds) return '#222222';     // neutralno

    const imp = 1 / odds;                    // implied p
    const impOther = 1 / otherOdds;
    const total = imp + impOther;

    const normProb = (imp / total) * 100;         // 0–100 %
    return this.getWpColor(normProb);             // isti gradijent
  }

  /* ----------  Value Margin → boja  ---------- */
  getValueColor(vm?: number): string {
    const val = vm ?? 0;

    // magnitude (0–1) ograniči na 20 % da ne “gori” precrveno
    const t = Math.min(Math.abs(val), 20) / 20;

    return val >= 0
      ? this.mix('#222222', '#43a047', t)         // od sive → zelene
      : this.mix('#222222', '#e53935', t);        // od sive → crvene
  }

/* ----------  Who to Bet – ime ---------- */
getWhoToBetName(): string | null {
  const d = this.summaryData;

  if (!d?.who2Bet) return null;          // 0 ili undefined → nema prikaza

  // Možda undefined → pretvori u null
  const name = d.who2Bet === 1 ? d.player1Name : d.player2Name;
  return name ?? null;                   // '??' => ako je undefined, vrati null
}

/* ----------  Who to Bet – boja ---------- */
getWhoToBetColor(): string {
  const d = this.summaryData;                 // 🆕

  if (d?.who2Bet === 1) return this.getValueColor(d.valueMarginPlayer1);
  if (d?.who2Bet === 2) return this.getValueColor(d.valueMarginPlayer2);
  return '#222222';                           // neutralno
}
}