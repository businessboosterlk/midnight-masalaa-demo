// src/app/screens/myscore.component.ts
import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DemoStore } from '../core/store';
import { BandBadgeComponent } from '../ui/band-badge.component';

@Component({
  selector: 'mm-myscore',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, BandBadgeComponent],
  template: `
    <header class="page-heading"><div><h1>My score</h1><p>{{ store.periodLabel }}</p></div></header>
    @if (score(); as result) {
      <div class="personal-score-layout">
        <section class="panel stack-lg" aria-labelledby="personal-score-title">
          <div class="score-summary">
            <h2 id="personal-score-title">{{ store.empName(store.role()) }}</h2>
            <strong class="score-hero numeric" [attr.data-fig]="path() + '.overall'" [attr.data-fmt]="'1dp'">{{ result.overall === null ? 'N/A' : (result.overall | number:'1.1-1') }}</strong>
            <mm-band-badge [overall]="result.overall" [path]="path() + '.overall'" />
          </div>
          @switch (coach().kind) {
            @case ('reach') { <p class="coach"><span>Your next <strong [attr.data-fig]="'coach.' + store.role() + '.n'" [attr.data-fmt]="'int'">{{ c().n }}</strong> {{ c().n === 1 ? 'job' : 'jobs' }} approved on time, at your current quality, would take you to
              <strong [attr.data-fig]="'coach.' + store.role() + '.to'" [attr.data-fmt]="'1dp'">{{ c().to | number:'1.1-1' }}</strong>@if (c().to < store.excellentMin()) {<span>, which rounds into Excellent.</span>} @else {<span>: Excellent.</span>}</span></p> }
            @case ('there') { <p class="coach">You are in Excellent. Keep the next jobs on time to stay there.</p> }
            @case ('quality') { <p class="coach">On time work alone will not reach Excellent this month. Quality is what is holding the score: see what hurt it.</p> }
            @default { <p class="coach">Your score starts once your first job this month is approved.</p> }
          }
          <dl class="personal-facts">
            <div><dt>Completion</dt><dd>
              <span [attr.data-fig]="path() + '.completed'" [attr.data-fmt]="'int'">{{ result.completed }}</span> of
              <span [attr.data-fig]="path() + '.cohort'" [attr.data-fmt]="'int'">{{ result.cohort }}</span> =
              <span [attr.data-fig]="path() + '.completionPct'" [attr.data-fmt]="'1dp'">{{ result.completionPct === null ? 'N/A' : (result.completionPct | number:'1.1-1') }}</span>@if (result.completionPct !== null) {<span>%</span>}
            </dd></div>
            <div><dt>On time</dt><dd><span [attr.data-fig]="path() + '.ontimePct'" [attr.data-fmt]="'1dp'">{{ result.ontimePct === null ? 'N/A' : (result.ontimePct | number:'1.1-1') }}</span>@if (result.ontimePct !== null) {<span>%</span>}</dd></div>
            <div><dt>Quality</dt><dd><span [attr.data-fig]="path() + '.qualityPct'" [attr.data-fmt]="'1dp'">{{ result.qualityPct === null ? 'N/A' : (result.qualityPct | number:'1.1-1') }}</span>@if (result.qualityPct !== null) {<span>%</span>}</dd></div>
          </dl>
          <button type="button" class="primary" (click)="store.openSheet('drill', 'emp:' + store.role())">See my calculation and jobs</button>
        </section>
        <aside class="panel stack" aria-labelledby="hurt-title">
          <h2 id="hurt-title">What hurt my score</h2>
          @if (hurt().length) {
            <p class="caption muted">Each line is what fixing that one job would have added, worked out by the scoring engine.</p>
            <ul class="hurt">
              @for (h of hurt(); track h.ref + h.kind) {
                <li><button type="button" class="hurt-row" (click)="store.openSheet('job', h.ref)">
                  <span class="ht"><strong>{{ h.title }}</strong><span class="caption muted">{{ h.why }}</span></span>
                  <span class="hc">&minus;<span [attr.data-fig]="'hurt.' + store.role() + '.' + h.ref + '.' + h.kind" [attr.data-fmt]="'1dp'">{{ h.cost | number:'1.1-1' }}</span></span>
                </button></li>
              }
            </ul>
          } @else { <p class="muted">Nothing cost you points this month.</p> }
          <p class="caption muted">0.5 × completion + 0.3 × on time + 0.2 × quality. Approved jobs count as completed, cancelled jobs are left out.</p>
        </aside>
      </div>
    } @else {
      <div class="empty"><h2>Employee view</h2><p>Switch demo role to see an employee score.</p>
        <button type="button" class="primary" (click)="store.openSheet('role')">Switch demo role</button>
      </div>
    }
  `,
  styles: `
    .personal-score-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr); gap: 1.5rem; max-width: 62rem; align-items: start; }
    .personal-facts { margin: 0; display: grid; gap: 1rem; }
    .personal-facts > div { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
    .coach { border-left: 2px solid var(--text); padding: 0.25rem 0 0.25rem 0.75rem; }
    .hurt { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
    .hurt-row { width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.75rem; align-items: center; text-align: left; padding: 0.625rem 0.875rem; }
    .ht { display: grid; gap: 0.125rem; min-width: 0; } .ht strong { overflow-wrap: anywhere; font-weight: 600; }
    .hc { font-variant-numeric: tabular-nums; font-weight: 650; color: var(--red); white-space: nowrap; }
    dt { color: var(--muted); } dd { margin: 0; font-variant-numeric: tabular-nums; }
    @media (max-width: 767px) { .personal-score-layout { grid-template-columns: 1fr; } }
  `
})
export class MyscoreComponent {
  protected readonly store = inject(DemoStore);
  protected readonly score = computed(() => this.store.role() === 'director'
    ? null : this.store.score({ emp: this.store.role() }));
  protected readonly path = computed(() => 'score.emp.' + this.store.role());
  protected readonly coach = computed(() => this.store.role() === 'director' ? { kind: 'na' as const } : this.store.coaching(this.store.role()));
  protected readonly c = computed(() => { const k = this.coach(); return k.kind === 'reach' ? k : { n: 0, to: 0 }; });
  protected readonly hurt = computed(() => this.store.role() === 'director' ? [] : this.store.whatHurt(this.store.role()).slice(0, 6));
}
