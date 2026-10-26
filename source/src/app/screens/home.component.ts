// Today: the Director's dashboard. Every printed figure comes from the store and carries data-fig;
// bars and the ring only DRAW values the store already worked out.
import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DemoStore } from '../core/store';
import { MmIconComponent } from '../ui/icon.component';
import { BandBadgeComponent } from '../ui/band-badge.component';
import { DeptIconComponent } from '../ui/dept-icon.component';
import { MeterComponent } from '../ui/meter.component';
import { RingComponent } from '../ui/ring.component';

@Component({
  selector: 'mm-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, MmIconComponent, BandBadgeComponent, DeptIconComponent, MeterComponent, RingComponent],
  template: `
    <header class="page-heading">
      <div><h1>Move the day forward</h1>
        <p>{{ store.fmtDay(store.now) }}, {{ store.fmtTime(store.now) }}. Demo clock frozen.</p>
      </div>
      <div class="head-actions">
        <button type="button" class="secondary button-content" (click)="store.openSheet('assign', 'snap')"><mm-icon name="camera" />Snap to assign</button>
        <button type="button" class="primary button-content" (click)="store.openSheet('assign')"><mm-icon name="plus" />Assign a job</button>
      </div>
    </header>

    <section class="panel decisions" aria-labelledby="decision-heading">
      <div class="section-head"><div><p class="caption muted">YOUR NEXT ACTION</p><h2 id="decision-heading">Needs your decision</h2></div>
        <button type="button" (click)="store.nav('approvals')">Open approvals</button></div>
      @for (job of store.decisionJobs().slice(0, 4); track job.ref) {
        <button type="button" class="decision-row" (click)="store.openSheet('job', job.ref)">
          <span><strong>{{ job.title }}</strong><small>{{ store.empName(job.assignee) }} · {{ store.deptName(job.dept) }}</small>
          @if (job.blockedReason) { <small>{{ job.blockedReason }}</small> }</span>
          <span class="decision-action">{{ store.decisionLabel(job) }} <mm-icon name="chevron-right" /></span>
        </button>
      } @empty { <p class="muted">Nothing is waiting for your decision. Check the jobs due next.</p> }
    </section>

    <section class="kpis" aria-label="Today at a glance">
      <button type="button" class="kpi" (click)="openState('overdue')">
        <strong class="numeric" [attr.data-fig]="'counts.overdue'" [attr.data-fmt]="'int'">{{ c().overdue }}</strong>
        <span class="kpi-label">Overdue</span>
      </button>
      <button type="button" class="kpi" (click)="store.nav('approvals')">
        <strong class="numeric" [attr.data-fig]="'counts.awaiting'" [attr.data-fmt]="'int'">{{ c().awaiting }}</strong>
        <span class="kpi-label">Waiting your approval</span>
      </button>
      <button type="button" class="kpi" (click)="openDay(0)">
        <strong class="numeric" [attr.data-fig]="'counts.dueToday'" [attr.data-fmt]="'int'">{{ c().dueToday }}</strong>
        <span class="kpi-label">Due today</span>
      </button>
      <button type="button" class="kpi" (click)="openDay(1)">
        <strong class="numeric" data-fig="counts.dueTomorrow" data-fmt="int">{{ c().dueTomorrow }}</strong><span class="kpi-label">Due tomorrow</span>
      </button>
      <button type="button" class="kpi" (click)="openState('completed')">
        <strong class="numeric" [attr.data-fig]="'counts.completed'" [attr.data-fmt]="'int'">{{ c().completed }}</strong>
        <span class="kpi-label">Completed</span>
      </button>
    </section>

    <div class="dash">
      <section class="panel score-card" aria-labelledby="co-title">
        <div class="section-head"><h2 id="co-title">Company score</h2>
          <mm-band-badge [overall]="co().overall" path="score.company.overall" /></div>
        <button type="button" class="score-body" (click)="store.openSheet('drill', 'company')" aria-label="See the working behind the company score">
          <mm-ring [value]="co().overall" [size]="148">
            <span class="ring-num numeric" [attr.data-fig]="'score.company.overall'" [attr.data-fmt]="'int'">{{ co().overall === null ? 'N/A' : (co().overall | number:'1.0-0') }}</span>
            <span class="ring-sub">of 100</span>
          </mm-ring>
          <span class="parts">
            <span class="part"><span class="part-head"><span>Completion</span><span class="muted">50%</span>
              <strong class="numeric" [attr.data-fig]="'score.company.completionPct'" [attr.data-fmt]="'int'">{{ co().completionPct | number:'1.0-0' }}</strong></span>
              <mm-meter [value]="co().completionPct" /></span>
            <span class="part"><span class="part-head"><span>On time</span><span class="muted">30%</span>
              <strong class="numeric" [attr.data-fig]="'score.company.ontimePct'" [attr.data-fmt]="'int'">{{ co().ontimePct | number:'1.0-0' }}</strong></span>
              <mm-meter [value]="co().ontimePct" /></span>
            <span class="part"><span class="part-head"><span>Quality</span><span class="muted">20%</span>
              <strong class="numeric" [attr.data-fig]="'score.company.qualityPct'" [attr.data-fmt]="'int'">{{ co().qualityPct | number:'1.0-0' }}</strong></span>
              <mm-meter [value]="co().qualityPct" /></span>
          </span>
        </button>
      </section>

      <section class="panel brief" aria-labelledby="brief-title">
        <div class="section-head"><h2 id="brief-title">Morning brief</h2><span class="sample-chip">Sample</span></div>
        <ul class="brief-list">
          <li><span>
            <strong [attr.data-fig]="'brief.overdue'" [attr.data-fmt]="'int'">{{ b().overdue }}</strong> jobs are past their deadline.</span></li>
          <li><span>
            <strong [attr.data-fig]="'brief.awaiting'" [attr.data-fmt]="'int'">{{ b().awaiting }}</strong> are waiting for your approval.</span></li>
          <li><span>{{ b().worst.name }} is furthest behind at
            <strong [attr.data-fig]="'brief.worstOverall'" [attr.data-fmt]="'int'">{{ b().worst.overall | number:'1.0-0' }}</strong>.</span></li>
          <li><span>
            <strong [attr.data-fig]="'brief.approvedYesterday'" [attr.data-fmt]="'int'">{{ b().approvedYesterday }}</strong> job was approved yesterday.</span></li>
        </ul>
        <p class="caption muted">Worded by the system from the records. You make the decisions.</p>
      </section>

      <section class="panel depts" aria-labelledby="dept-title">
        <div class="section-head"><h2 id="dept-title">Departments</h2><span class="caption muted">{{ store.periodLabel }}</span></div>
        <div class="dept-chart" role="list">
          @for (row of ranked(); track row.key; let i = $index) {
            <button type="button" class="dept-row" role="listitem" (click)="store.openSheet('drill', 'dept:' + row.key)"
              [attr.aria-label]="row.name + ', open the working'">
              <span class="rank numeric">{{ i + 1 }}</span>
              <mm-dept-icon [dept]="row.key" size="sm" />
              <span class="dept-main">
                <span class="dept-top"><span class="dept-name">{{ row.name }}</span>
                  <mm-band-badge [overall]="row.score.overall" [path]="'score.dept.' + row.key + '.overall'" /></span>
                <mm-meter [value]="row.score.overall" [thick]="true" />
              </span>
              <strong class="dept-score numeric" [attr.data-fig]="'score.dept.' + row.key + '.overall'" [attr.data-fmt]="'1dp'">{{ row.score.overall === null ? 'N/A' : (row.score.overall | number:'1.1-1') }}</strong>
            </button>
          }
        </div>
      </section>

      <section class="panel status" aria-labelledby="status-title">
        <div class="section-head"><h2 id="status-title">Workload and exceptions</h2>
          <span class="caption muted"><span [attr.data-fig]="'counts.total'" [attr.data-fmt]="'int'">{{ c().total }}</span> in all</span></div>
        <p class="caption muted">Overdue is an exception, not a separate stage. These groups overlap.</p>
        <div class="status-list">
          @for (s of statusRows(); track s.key) {
            <button type="button" class="status-row" (click)="openState(s.filter)">
              <mm-icon [name]="s.icon" /><span class="s-label">{{ s.label }}</span>
              <mm-meter class="s-bar" [value]="s.share" />
              <strong class="numeric" [attr.data-fig]="'counts.' + s.key" [attr.data-fmt]="'int'">{{ s.value }}</strong>
            </button>
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    .decisions { margin-bottom: 1.25rem; }
    .decision-row { width: 100%; border: 0; border-top: 1px solid var(--line); border-radius: 0; padding: 1rem 0; display: flex; align-items: center; justify-content: space-between; gap: 1rem; text-align: left; background: transparent; }
    .decision-row small { display: block; color: var(--muted); margin-top: .25rem; }
    .decision-action { display: flex; align-items: center; gap: .5rem; flex-shrink: 0; font-weight: 600; }
    @media(max-width:767px) { .decision-row { align-items: flex-start; flex-direction: column; } }
    .head-actions { display: flex; gap: 0.625rem; flex-wrap: wrap; }
    @media (max-width: 767px) { .head-actions { display: grid; grid-template-columns: 1fr 1fr; width: 100%; } }
    h2 { display: flex; align-items: center; gap: 0.625rem; }
    h2 mm-icon { width: 18px; height: 18px; color: var(--muted); }
    .kpis { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.75rem; margin-bottom: 1.25rem; }
    .kpi { display: flex; flex-direction: column-reverse; justify-content: flex-end; gap: 0.375rem; align-items: flex-start;
      text-align: left; padding: 1rem 1.125rem; border-radius: var(--radius-md); background: var(--surface); }
    .kpi-icon { grid-row: 1 / 3; width: 2.75rem; height: 2.75rem; border-radius: 0.875rem; display: grid; place-items: center;
      background: var(--raised); border: 1px solid var(--line); }
    .kpi-icon.strong { background: var(--text); color: var(--inverse); border-color: var(--text); }
    .kpi-icon mm-icon { width: 1.25rem; height: 1.25rem; }
    .kpi strong { font-size: 1.875rem; line-height: 1.05; letter-spacing: -0.04em; font-weight: 650; }
    .kpi-label { font-size: 0.75rem; font-weight: 600; color: var(--muted); }
    .kpi:first-child strong { color: var(--red); }
    .dash { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: 1.25rem; align-items: start; }
    .score-body { display: grid; grid-template-columns: auto 1fr; gap: 1.5rem; align-items: center; width: 100%; padding: 0.25rem;
      background: transparent; border: 0; text-align: left; }
    .ring-num { display: block; font-size: 2.75rem; font-weight: 650; line-height: 1; letter-spacing: -0.05em; }
    .ring-sub { display: block; font-size: var(--text-xs); color: var(--muted); margin-top: 0.25rem; }
    .parts { display: grid; gap: 1rem; }
    .part { display: grid; gap: 0.4rem; }
    .part-head { display: grid; grid-template-columns: 1fr auto 2.5rem; gap: 0.5rem; font-size: var(--text-sm); align-items: baseline; }
    .part-head strong { text-align: right; }
    .brief-list { list-style: none; margin: 0 0 0.75rem; padding: 0; display: grid; }
    .brief-list li { padding: 0.625rem 0; border-bottom: 1px solid var(--line); font-size: 0.9375rem; }
    .brief-list li:last-child { border-bottom: 0; }
    .b-icon { width: 2rem; height: 2rem; border-radius: 0.625rem; display: grid; place-items: center; background: var(--raised); border: 1px solid var(--line); }
    .b-icon mm-icon { width: 1rem; height: 1rem; }
    .depts { grid-column: 1; }
    .status { grid-column: 2; }
    .dept-chart { display: grid; gap: 0.25rem; }
    .dept-row { display: grid; grid-template-columns: 1.25rem auto minmax(0, 1fr) 3.25rem; gap: 0.875rem; align-items: center;
      width: 100%; text-align: left; background: transparent; border: 0; border-radius: var(--radius-sm); padding: 0.625rem 0.5rem; }
    .rank { color: var(--quiet); font-size: var(--text-sm); text-align: right; }
    .dept-main { display: grid; gap: 0.5rem; min-width: 0; }
    .dept-top { display: flex; justify-content: space-between; gap: 0.5rem 0.75rem; align-items: center; flex-wrap: wrap; min-width: 0; }
    .dept-name { font-weight: 600; font-size: var(--text-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dept-score { font-size: 1.25rem; text-align: right; letter-spacing: -0.02em; }
    .status-list { display: grid; gap: 0.25rem; }
    .status-row { display: grid; grid-template-columns: auto 8.5rem minmax(0, 1fr) 2.5rem; gap: 0.75rem; align-items: center;
      width: 100%; text-align: left; background: transparent; border: 0; padding: 0.625rem 0.5rem; border-radius: var(--radius-sm); }
    .status-row mm-icon { width: 18px; height: 18px; color: var(--muted); }
    .status-row strong { text-align: right; }
    .s-label { font-size: var(--text-sm); }
    @media (hover: hover) { .dept-row:hover, .status-row:hover, .score-body:hover { background: var(--raised); } }
    @media (max-width: 1199px) { .dash { grid-template-columns: 1fr; } .depts, .status { grid-column: auto; } }
    @media (max-width: 767px) {
      .kpis { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
      .kpi { padding: 0.875rem; column-gap: 0.625rem; }
      .kpi-icon { width: 2.25rem; height: 2.25rem; }
      .kpi strong { font-size: 1.625rem; }
      .score-body { grid-template-columns: 1fr; justify-items: center; }
      .parts { width: 100%; }
      .dept-row { grid-template-columns: auto minmax(0, 1fr) 3rem; }
      .rank { display: none; }
      .status-row { grid-template-columns: auto 7rem minmax(0, 1fr) 2rem; }
    }
  `
})
export class HomeComponent {
  protected readonly store = inject(DemoStore);
  protected readonly c = computed(() => this.store.counts());
  protected readonly co = computed(() => this.store.score(null));
  protected readonly b = computed(() => this.store.brief());
  protected readonly ranked = computed(() => this.store.departments
    .map(d => ({ ...d, score: this.store.score({ dept: d.key }) }))
    .sort((a, b) => (b.score.overall ?? -1) - (a.score.overall ?? -1)));
  // bar lengths are drawn as a share of all jobs; only the store's counts are printed
  protected readonly statusRows = computed(() => {
    const c = this.c(); const share = (n: number) => c.total ? n / c.total * 100 : 0;
    return [
      { key: 'overdue', label: 'Overdue', icon: 'triangle-alert', value: c.overdue, share: share(c.overdue), filter: 'overdue' },
      { key: 'awaiting', label: 'Awaiting approval', icon: 'clock', value: c.awaiting, share: share(c.awaiting), filter: 'awaiting' },
      { key: 'inProgress', label: 'In progress', icon: 'loader', value: c.inProgress, share: share(c.inProgress), filter: '' },
      { key: 'completed', label: 'Completed', icon: 'circle-check', value: c.completed, share: share(c.completed), filter: 'completed' },
      { key: 'cancelled', label: 'Cancelled', icon: 'x', value: c.cancelled, share: share(c.cancelled), filter: 'cancelled' },
    ] as const;
  });

  protected openState(state: string): void {
    this.store.clearFilters();
    this.store.setFilters({ q: '', dept: '', state, prio: '' });
    // In progress opens the board unfiltered: its In progress column holds exactly that count, overdue ones included
    this.store.setBoardView(state === 'cancelled' ? 'list' : state === '' ? 'board' : this.store.boardView());
    this.store.nav('jobs');
  }
  protected openDay(days: number): void {
    this.store.clearFilters(); const date = this.store.shiftDate(days);
    this.store.setFilters({ from: date, to: date, state: 'upcoming' }); this.store.setBoardView('list'); this.store.nav('jobs');
  }
}
