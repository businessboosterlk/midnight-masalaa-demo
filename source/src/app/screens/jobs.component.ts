// src/app/screens/jobs.component.ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DemoStore } from '../core/store';
import { MmIconComponent } from '../ui/icon.component';
import { JobCardComponent } from '../ui/job-card.component';

@Component({
  selector: 'mm-jobs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MmIconComponent, JobCardComponent],
  template: `
    <header class="page-heading">
      <div><h1>{{ store.role() === 'director' ? 'Jobs' : 'My jobs' }}</h1><p>Find the work. See the next step.</p></div>
      @if (store.role() === 'director') {
        <button type="button" class="primary button-content" (click)="store.openSheet('assign')">
          <mm-icon name="plus" aria-hidden="true" />Assign a job
        </button>
      }
    </header>

    <section class="filters" aria-label="Filter jobs">
      <label class="field search-field"><span>Search</span>
        <input type="search" placeholder="Job title or reference" [value]="store.filters().q"
          (input)="store.setFilters({ q: $any($event.target).value })" />
      </label>
      <label class="field"><span>Department</span><span class="select-wrap">
        <select [value]="store.filters().dept" (change)="store.setFilters({ dept: $any($event.target).value })">
          <option value="">All departments</option>
          @for (dept of store.departments; track dept.key) { <option [value]="dept.key">{{ dept.name }}</option> }
        </select><mm-icon name="chevron-down" aria-hidden="true" />
      </span></label>
      <label class="field"><span>Status</span><span class="select-wrap">
        <select [value]="store.filters().state" (change)="store.setFilters({ state: $any($event.target).value })">
          <option value="">All statuses</option>
          @for (status of statuses; track status.key) { <option [value]="status.key">{{ status.label }}</option> }
        </select><mm-icon name="chevron-down" aria-hidden="true" />
      </span></label>
      <label class="field"><span>Priority</span><span class="select-wrap">
        <select [value]="store.filters().prio" (change)="store.setFilters({ prio: $any($event.target).value })">
          <option value="">All priorities</option>
          @for (priority of priorities; track priority) { <option [value]="priority">{{ priority }}</option> }
        </select><mm-icon name="chevron-down" aria-hidden="true" />
      </span></label>
    </section>

    <details class="panel advanced-filters"><summary>People and deadline filters</summary>
      <div class="filters">
        @if (store.role() === 'director') {
          <label class="field"><span>Employee</span><select [value]="store.filters().emp" (change)="store.setFilters({ emp: $any($event.target).value })">
            <option value="">All employees</option>@for (e of store.employees; track e.id) { <option [value]="e.id">{{ e.name }}</option> }
          </select></label>
        }
        <label class="field"><span>Due from</span><input type="date" [value]="store.filters().from" (change)="store.setFilters({ from: $any($event.target).value })" /></label>
        <label class="field"><span>Due through</span><input type="date" [value]="store.filters().to" (change)="store.setFilters({ to: $any($event.target).value })" /></label>
        <button type="button" (click)="clearFilters()">Clear all filters</button>
      </div>
    </details>

    <div class="section-head">
      <p class="muted"><span class="numeric" [attr.data-fig]="'jobs.visible'" [attr.data-fmt]="'int'">{{ visible().length }}</span> matching jobs</p>
      <div class="segmented" role="group" aria-label="Job view">
        <button type="button" [attr.aria-pressed]="store.boardView() === 'board'" (click)="store.setBoardView('board')">Board</button>
        <button type="button" [attr.aria-pressed]="store.boardView() === 'list'" (click)="store.setBoardView('list')">List</button>
      </div>
    </div>

    @if (store.boardView() === 'board') {
      <p class="caption muted board-note">Overdue jobs stay in their stage. Cancelled jobs appear in the list only.</p>
      @if (store.filters().state === 'cancelled') {
        <div class="empty"><h2>Cancelled jobs are in the list</h2><p>Your filter is kept when you change views.</p>
          <button type="button" class="primary" (click)="store.setBoardView('list')">Show list</button>
        </div>
      } @else {
        <div class="kanban" role="region" aria-label="Job board" tabindex="0">
          @for (column of board(); track column.state) {
            <section class="board-column" [attr.aria-label]="column.label">
              <h2>{{ column.label }} <span class="col-count">{{ column.jobs.length }}</span></h2>
              <div class="board-cards" tabindex="0" [attr.aria-label]="column.label + ' jobs'">
                @for (job of column.jobs; track job.ref) { <mm-job-card [job]="job" /> }
                @empty { <div class="empty column-empty"><p>No jobs here</p></div> }
              </div>
            </section>
          }
        </div>
      }
    } @else {
      <div class="compact-list">
        @for (job of visible(); track job.ref) {
          <button type="button" class="compact-row" (click)="store.openSheet('job', job.ref)">
            <span><strong>{{ job.title }}</strong><small>{{ store.deptName(job.dept) }} · {{ job.ref }}</small></span>
            <span>{{ store.empName(job.assignee) }}</span>
            <span>{{ store.fmtDay(store.effectiveDue(job)) }}<small>{{ store.fmtTime(store.effectiveDue(job)) }}</small></span>
            <span class="chip" [attr.data-state]="store.derivedState(job)">{{ stateLabel(job) }}</span>
          </button>
        }
        @empty {
          <div class="empty"><h2>No matching jobs</h2><p>Try another search or clear the filters.</p>
            <button type="button" (click)="clearFilters()">Clear filters</button>
          </div>
        }
      </div>
    }
  `,
  styles: `
    .advanced-filters { margin-bottom: 1rem; padding: .75rem 1rem; } summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; font-weight: 600; }
    .compact-list { border: 1px solid var(--line); border-radius: var(--radius-md); overflow: hidden; background: var(--surface); }
    .compact-row { width:100%; display:grid; grid-template-columns: minmax(0,2fr) minmax(0,1fr) 8rem 9rem; gap:1rem; align-items:center; text-align:left; border:0; border-bottom:1px solid var(--line); border-radius:0; padding:1rem; background:transparent; }
    .compact-row small { display:block; color:var(--muted); margin-top:.25rem; } .compact-row .chip { justify-self:start; }
    @media(max-width:767px) { .compact-row { grid-template-columns:1fr auto; gap:.75rem; } .compact-row > span:first-child { grid-column:1 / -1; } .compact-row > span:nth-child(2) { display:none; } }
    .board-note { margin-bottom: 1rem; }
    .column-empty { padding: 1.5rem 0.25rem; }
    .board-cards:focus-visible, .kanban:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px; }
  `
})
export class JobsComponent {
  protected readonly store = inject(DemoStore);
  protected readonly priorities = ['Low', 'Medium', 'High', 'Urgent'] as const;
  protected readonly statuses = [
    { key: 'not_started', label: 'Not started' }, { key: 'in_progress', label: 'In progress' },
    { key: 'blocked', label: 'Blocked' }, { key: 'awaiting', label: 'Awaiting approval' },
    { key: 'overdue', label: 'Overdue' }, { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' }, { key: 'upcoming', label: 'Upcoming active work' }
  ];
  private readonly columns = [
    { state: 'not_started', label: 'Not started' },
    { state: 'in_progress', label: 'In progress' },
    { state: 'blocked', label: 'Blocked' },
    { state: 'submitted', label: 'Awaiting approval' },
    { state: 'approved', label: 'Completed' }
  ];
  protected readonly visible = computed(() => this.store.filteredJobs());
  protected readonly board = computed(() => this.columns.map(column => ({
    ...column, jobs: this.visible().filter(job => job.state === column.state)
  })));

  protected clearFilters(): void {
    this.store.clearFilters();
  }
  protected stateLabel(job: import('../core/store').Job): string { return this.statuses.find(s => s.key === this.store.derivedState(job))?.label || job.state; }
}
