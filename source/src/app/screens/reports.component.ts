// Reports (in his brief, acceptance test 8): weekly and monthly reports from the same engine as the scoreboard,
// filtered by department, downloadable for Excel. Every figure carries data-fig and is recounted by qa/recompute.mjs.
import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DemoStore } from '../core/store';
import { MmIconComponent } from '../ui/icon.component';
import { BandBadgeComponent } from '../ui/band-badge.component';

@Component({
  selector: 'mm-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, MmIconComponent, BandBadgeComponent],
  template: `
    <header class="page-heading"><div><h1>Reports</h1><p>{{ store.periodText(period()) }}</p></div>
      <div class="head-actions">
        <button type="button" class="secondary button-content" (click)="store.openPdf()"><mm-icon name="file-down" />Monthly PDF, sample</button>
        <button type="button" class="primary button-content" (click)="store.downloadReport(period(), dept())"><mm-icon name="sheet" />Download for Excel</button>
      </div>
    </header>
    <div class="filters-row">
      <div class="segmented" role="group" aria-label="Period">
        <button type="button" [attr.aria-pressed]="period() === 'month'" (click)="period.set('month')">This month</button>
        <button type="button" [attr.aria-pressed]="period() === 'week'" (click)="period.set('week')">Last 7 days</button>
      </div>
      <span class="select-wrap"><select aria-label="Department" (change)="dept.set(val($event))">
        <option value="" [selected]="!dept()">All departments</option>
        @for (d of store.departments; track d.key) { <option [value]="d.key" [selected]="dept() === d.key">{{ d.name }}</option> }
      </select><mm-icon name="chevron-down" /></span>
    </div>

    <section class="panel summary" aria-label="Summary">
      <div class="big"><span class="caption muted">{{ dept() ? store.deptName(dept()) : 'Company' }} score</span>
        <strong class="numeric" [attr.data-fig]="p('overall', scope())" [attr.data-fmt]="'1dp'">{{ top().overall === null ? 'N/A' : (top().overall | number:'1.1-1') }}</strong>
        <mm-band-badge [overall]="top().overall" [path]="p('overall', scope())" /></div>
      <dl class="facts">
        <div><dt>Jobs due in the period</dt><dd [attr.data-fig]="p('cohort', scope())" [attr.data-fmt]="'int'">{{ top().cohort }}</dd></div>
        <div><dt>Completed, approved</dt><dd [attr.data-fig]="p('completed', scope())" [attr.data-fmt]="'int'">{{ top().completed }}</dd></div>
        <div><dt>On time, of those completed</dt><dd><span [attr.data-fig]="p('ontimeN', scope())" [attr.data-fmt]="'int'">{{ top().ontimeN }}</span> of <span [attr.data-fig]="p('ontimeD', scope())" [attr.data-fmt]="'int'">{{ top().ontimeD }}</span></dd></div>
        <div><dt>Sent back for a fix</dt><dd [attr.data-fig]="p('rejectionCount', scope())" [attr.data-fmt]="'int'">{{ top().rejectionCount }}</dd></div>
        <div><dt>Cancelled, left out</dt><dd [attr.data-fig]="p('cancelledExcluded', scope())" [attr.data-fmt]="'int'">{{ top().cancelledExcluded }}</dd></div>
      </dl>
    </section>

    <section class="panel" aria-labelledby="rep-table">
      <h2 id="rep-table">{{ dept() ? 'By person' : 'By department' }}</h2>
      <div class="table-scroll"><table class="rep">
        <thead><tr><th>{{ dept() ? 'Person' : 'Department' }}</th><th>Jobs due</th><th>Completed</th><th>On time</th><th>Quality</th><th>Score</th><th>Band</th></tr></thead>
        <tbody>
          @for (r of rows(); track r.key) {
            <tr><td>{{ r.name }}</td>
              <td [attr.data-fig]="p('cohort', r.key)" [attr.data-fmt]="'int'">{{ r.s.cohort }}</td>
              <td [attr.data-fig]="p('completed', r.key)" [attr.data-fmt]="'int'">{{ r.s.completed }}</td>
              <td>@if (r.s.ontimePct === null) {N/A} @else {<span [attr.data-fig]="p('ontimePct', r.key)" [attr.data-fmt]="'1dp'">{{ r.s.ontimePct | number:'1.1-1' }}</span>%}</td>
              <td>@if (r.s.qualityPct === null) {N/A} @else {<span [attr.data-fig]="p('qualityPct', r.key)" [attr.data-fmt]="'1dp'">{{ r.s.qualityPct | number:'1.1-1' }}</span>%}</td>
              <td><strong [attr.data-fig]="p('overall', r.key)" [attr.data-fmt]="'1dp'">{{ r.s.overall === null ? 'N/A' : (r.s.overall | number:'1.1-1') }}</strong></td>
              <td><mm-band-badge [overall]="r.s.overall" [path]="p('overall', r.key)" /></td></tr>
          }
        </tbody>
      </table></div>
      <p class="caption muted">Same engine and rules as Scores: 0.5 × completion + 0.3 × on time + 0.2 × quality. Emailing the report every Monday is simulated in the demo.</p>
    </section>
  `,
  styles: `
    .head-actions { display: flex; gap: 0.625rem; flex-wrap: wrap; }
    .filters-row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
    .filters-row .select-wrap { min-width: 16rem; }
    .summary { display: grid; grid-template-columns: minmax(12rem, 0.6fr) 1fr; gap: 1.5rem; align-items: center; margin-bottom: 1.25rem; }
    .big { display: grid; gap: 0.375rem; justify-items: start; } .big strong { font-size: 3rem; font-weight: 700; letter-spacing: -0.03em; line-height: 1; }
    .facts { margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr)); gap: 1rem; }
    .facts dt { color: var(--muted); font-size: var(--text-xs); } .facts dd { margin: 0.25rem 0 0; font-size: 1.25rem; font-weight: 650; font-variant-numeric: tabular-nums; }
    .rep { width: 100%; border-collapse: collapse; margin-top: 0.75rem; font-variant-numeric: tabular-nums; }
    .rep th { text-align: left; font-size: var(--text-xs); color: var(--muted); font-weight: 600; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--line); white-space: nowrap; }
    .rep td { padding: 0.625rem 0.75rem; border-bottom: 1px solid var(--line); white-space: nowrap; }
    .table-scroll { overflow-x: auto; }
    @media (max-width: 767px) { .summary { grid-template-columns: 1fr; } .head-actions { display: grid; grid-template-columns: 1fr; width: 100%; } .filters-row .select-wrap { min-width: 0; width: 100%; } .filters-row .segmented { width: 100%; } .filters-row .segmented button { flex: 1; } }
  `,
})
export class ReportsComponent {
  protected readonly store = inject(DemoStore);
  protected readonly period = signal<'month' | 'week'>('month');
  protected readonly dept = signal('');
  protected readonly scope = computed(() => this.dept() ? 'dept.' + this.dept() : 'company');
  protected readonly top = computed(() => this.store.scoreIn(this.period(), this.dept() ? { dept: this.dept() } : null));
  protected readonly rows = computed(() => this.dept()
    ? this.store.empsOf(this.dept()).map(e => ({ key: 'emp.' + e.id, name: e.name, s: this.store.scoreIn(this.period(), { emp: e.id }) }))
    : this.store.departments.map(d => ({ key: 'dept.' + d.key, name: d.name, s: this.store.scoreIn(this.period(), { dept: d.key }) })));
  protected p(field: string, scope: string): string { return `rep.${this.period()}.${scope}.${field}`; }
  protected val(e: Event): string { return (e.target as HTMLSelectElement).value; }
}
