// src/app/screens/scoreboard.component.ts
import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DemoStore } from '../core/store';
import { MmIconComponent } from '../ui/icon.component';
import { BandBadgeComponent } from '../ui/band-badge.component';
import { RingComponent } from '../ui/ring.component';
import { MeterComponent } from '../ui/meter.component';
import { DeptIconComponent } from '../ui/dept-icon.component';
import { AvatarComponent } from '../ui/avatar.component';

@Component({
  selector: 'mm-scoreboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, MmIconComponent, BandBadgeComponent, RingComponent, MeterComponent, DeptIconComponent, AvatarComponent],
  template: `
    <header class="page-heading"><div><h1>Scoreboard</h1><p>{{ store.periodLabel }}</p></div>
      <button type="button" class="secondary button-content" (click)="store.openPdf()">
        <mm-icon name="file-down" aria-hidden="true" />Sample monthly PDF
      </button>
    </header>
    <div class="score-grid">
      <div class="stack-lg">
        <section class="panel stack-lg" aria-labelledby="company-score-title">
          <div class="score-summary"><h2 id="company-score-title">Company score</h2>
            <mm-ring [value]="company().overall" [size]="168"><strong class="ring-num numeric" [attr.data-fig]="'score.company.overall'" [attr.data-fmt]="'1dp'">{{ company().overall === null ? 'N/A' : (company().overall | number:'1.1-1') }}</strong><span class="caption muted">of 100</span></mm-ring>
            <mm-band-badge [overall]="company().overall" path="score.company.overall" />
          </div>
          <dl class="score-facts">
            <div><dt>Completion</dt><dd><span [attr.data-fig]="'score.company.completionPct'" [attr.data-fmt]="'1dp'">{{ company().completionPct === null ? 'N/A' : (company().completionPct | number:'1.1-1') }}</span>@if (company().completionPct !== null) {<span>%</span>}</dd></div>
            <div><dt>On time</dt><dd><span [attr.data-fig]="'score.company.ontimePct'" [attr.data-fmt]="'1dp'">{{ company().ontimePct === null ? 'N/A' : (company().ontimePct | number:'1.1-1') }}</span>@if (company().ontimePct !== null) {<span>%</span>}</dd></div>
            <div><dt>Quality</dt><dd><span [attr.data-fig]="'score.company.qualityPct'" [attr.data-fmt]="'1dp'">{{ company().qualityPct === null ? 'N/A' : (company().qualityPct | number:'1.1-1') }}</span>@if (company().qualityPct !== null) {<span>%</span>}</dd></div>
          </dl>
          <p class="caption muted">0.5 × completion + 0.3 × on time + 0.2 × quality</p>
          <button type="button" class="primary" (click)="store.openSheet('drill', 'company')">See the working</button>
        </section>

        <section class="panel stack" aria-labelledby="bands-title">
          <h2 id="bands-title">Performance bands</h2>
          <label class="field" for="excellent-min"><span>Excellent starts at
            <strong class="numeric" [attr.data-fig]="'config.excellentMin'" [attr.data-fmt]="'raw'">{{ store.excellentMin() }}</strong>
          </span></label>
          <input id="excellent-min" type="range" min="85" max="90" step="1"
            [value]="store.excellentMin()" [disabled]="store.role() !== 'director'"
            (input)="setThreshold($event)" aria-describedby="bands-help" />
          <p id="bands-help" class="caption muted">Change the Excellent threshold to see the band treatment update. The scores do not change.</p>
        </section>
      </div>

      <section class="panel" aria-label="Performance breakdown">
        <div class="section-head">
          <h2>{{ view() === 'departments' ? 'Departments' : 'People' }}</h2>
          <div class="segmented" role="group" aria-label="Score grouping">
            <button type="button" [attr.aria-pressed]="view() === 'departments'" (click)="view.set('departments')">Departments</button>
            <button type="button" [attr.aria-pressed]="view() === 'people'" (click)="view.set('people')">People</button>
          </div>
        </div>
        <div class="rank-list">
          @if (view() === 'departments') {
            @for (row of departments(); track row.key) {
              <button type="button" class="rank-row with-icon" (click)="store.openSheet('drill', 'dept:' + row.key)"
                [attr.aria-label]="'View score calculation for ' + row.name">
                <mm-dept-icon [dept]="row.key" size="sm" />
                <span class="rank-name"><span class="rn-top"><strong>{{ row.name }}</strong>
                  <mm-band-badge [overall]="row.score.overall" [path]="'score.dept.' + row.key + '.overall'" /></span>
                  <mm-meter class="rn-bar" [value]="row.score.overall" [thick]="true" />
                </span>
                <span class="rank-score numeric" [attr.data-fig]="'score.dept.' + row.key + '.overall'" [attr.data-fmt]="'1dp'">{{ row.score.overall === null ? 'N/A' : (row.score.overall | number:'1.1-1') }}</span>
              </button>
            } @empty { <div class="empty"><h3>No department scores</h3><p>Scores appear when jobs are available.</p></div> }
          } @else {
            @for (row of people(); track row.id) {
              <button type="button" class="rank-row person-row with-icon" (click)="store.openSheet('drill', 'emp:' + row.id)"
                [attr.aria-label]="'View score calculation for ' + row.name">
                <mm-avatar [name]="row.name" size="sm" />
                <span class="rank-name"><strong>{{ row.name }}</strong>
                  <mm-band-badge [overall]="row.score.overall" [path]="'score.emp.' + row.id + '.overall'" />
                  <span class="caption muted">Completion:
                    <span [attr.data-fig]="'score.emp.' + row.id + '.completed'" [attr.data-fmt]="'int'">{{ row.score.completed }}</span> of
                    <span [attr.data-fig]="'score.emp.' + row.id + '.cohort'" [attr.data-fmt]="'int'">{{ row.score.cohort }}</span> =
                    <span [attr.data-fig]="'score.emp.' + row.id + '.completionPct'" [attr.data-fmt]="'1dp'">{{ row.score.completionPct === null ? 'N/A' : (row.score.completionPct | number:'1.1-1') }}</span>@if (row.score.completionPct !== null) {<span>%</span>}
                  </span>
                </span>
                <span class="rank-score numeric" [attr.data-fig]="'score.emp.' + row.id + '.overall'" [attr.data-fmt]="'1dp'">{{ row.score.overall === null ? 'N/A' : (row.score.overall | number:'1.1-1') }}</span>
              </button>
            } @empty { <div class="empty"><h3>No people yet</h3><p>Employees will appear when the demo data is available.</p></div> }
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    .with-icon { grid-template-columns: auto minmax(0, 1fr) auto; }
    .rn-top { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; width: 100%; }
    .rank-name { width: 100%; }
    .rn-bar { width: 100%; }
    .ring-num { display: block; font-size: 2.5rem; line-height: 1; letter-spacing: -0.05em; font-weight: 650; }
    .score-facts { margin: 0; display: grid; gap: 0.75rem; }
    .score-facts > div { display: flex; justify-content: space-between; gap: 1rem; }
    dt { color: var(--muted); } dd { margin: 0; font-variant-numeric: tabular-nums; }
  `
})
export class ScoreboardComponent {
  protected readonly store = inject(DemoStore);
  protected readonly view = signal<'departments' | 'people'>('departments');
  protected readonly company = computed(() => this.store.score(null));
  protected readonly departments = computed(() => this.store.departments
    .map(dept => ({ ...dept, score: this.store.score({ dept: dept.key }) }))
    .sort((a, b) => this.compareScores(a.score.overall, b.score.overall, a.name, b.name)));
  protected readonly people = computed(() => this.store.employees
    .map(emp => ({ ...emp, score: this.store.score({ emp: emp.id }) }))
    .sort((a, b) => this.compareScores(a.score.overall, b.score.overall, a.name, b.name)));

  protected setThreshold(event: Event): void {
    if (this.store.role() !== 'director') return;
    // Reading the native slider value is an input, not a calculated figure.
    this.store.setExcellentMin((event.target as HTMLInputElement).valueAsNumber);
  }

  private compareScores(x: number | null, y: number | null, a: string, b: string): number {
    if (x === y) return a.localeCompare(b);
    if (x === null) return 1;
    if (y === null) return -1;
    return x > y ? -1 : 1;
  }
}
