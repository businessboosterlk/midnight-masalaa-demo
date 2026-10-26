// src/app/screens/myday.component.ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DemoStore } from '../core/store';
import { JobCardComponent } from '../ui/job-card.component';
import { MmIconComponent } from '../ui/icon.component';

@Component({
  selector: 'mm-myday',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JobCardComponent, MmIconComponent],
  template: `
    <header class="page-heading"><div><h1>My day</h1>
      <p>{{ store.role() === 'director' ? 'Choose an employee to view their day.' : store.empName(store.role()) }}</p>
    </div></header>
    @if (day(); as work) {
      @if (work.returned.length) {
        <section class="panel stack fix-panel" aria-labelledby="returned-title">
          <div class="section-head"><h2 id="returned-title" class="ih">Fix required</h2>
            <span class="chip numeric" data-state="overdue" [attr.data-fig]="'myday.returned'" [attr.data-fmt]="'int'">{{ work.returned.length }}</span>
          </div>
          <p class="caption muted">Sent back with corrections. Check urgency and deadlines before choosing what to do next.</p>
          <div class="fix-cards">@for (job of work.returned; track job.ref) { <mm-job-card [job]="job" /> }</div>
        </section>
      }
      <div class="day-grid">
        <section class="panel stack" aria-labelledby="due-today-title">
          <div class="section-head"><h2 id="due-today-title" class="ih">Due today</h2>
            <span class="chip numeric" [attr.data-fig]="'myday.dueToday'" [attr.data-fmt]="'int'">{{ work.dueToday.length }}</span>
          </div>
          @for (job of work.dueToday; track job.ref) { <mm-job-card [job]="job" /> }
          @empty { <div class="empty"><mm-icon name="calendar-check" aria-hidden="true" /><p>No jobs due today</p></div> }
        </section>
        <section class="panel stack" aria-labelledby="overdue-title">
          <div class="section-head"><h2 id="overdue-title" class="ih">Overdue</h2>
            <span class="chip numeric" data-state="overdue" [attr.data-fig]="'myday.overdue'" [attr.data-fmt]="'int'">{{ work.overdue.length }}</span>
          </div>
          @for (job of work.overdue; track job.ref) { <mm-job-card [job]="job" /> }
          @empty { <div class="empty"><mm-icon name="check" aria-hidden="true" /><p>No overdue jobs</p></div> }
        </section>
      </div>
      @if (waiting().length) {
        <section class="panel stack wait-panel" aria-labelledby="waiting-title">
          <div class="section-head"><h2 id="waiting-title" class="ih">Waiting for the Director</h2><span class="chip numeric">{{ waiting().length }}</span></div>
          <p class="caption muted">Submitted. They count as completed once approved.</p>
          <div class="fix-cards">@for (job of waiting(); track job.ref) { <mm-job-card [job]="job" /> }</div>
        </section>
      }
    } @else {
      <div class="empty"><h2>Employee view</h2><p>Switch demo role to see assigned work.</p>
        <button type="button" class="primary" (click)="store.openSheet('role')">Switch demo role</button>
      </div>
    }
  `,
  styles: `.fix-panel { margin-bottom: 1.25rem; border-color: var(--red); } .fix-panel h2 { color: var(--red); }
    .wait-panel { margin-top: 1.25rem; }
    .fix-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 0.75rem; }
    .ih { display: flex; align-items: center; gap: 0.625rem; } .ih mm-icon { width: 18px; height: 18px; color: var(--muted); }`
})
export class MydayComponent {
  protected readonly store = inject(DemoStore);
  protected readonly waiting = computed(() => this.store.role() === 'director' ? [] : this.store.waitingFor(this.store.role()));
  protected readonly day = computed(() => this.store.role() === 'director'
    ? null : this.store.myDay(this.store.role()));
}
