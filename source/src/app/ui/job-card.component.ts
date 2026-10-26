// A job card. The whole card is one button that opens the job. State reads in words plus a monochrome treatment.
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DemoStore, Job } from '../core/store';
import { MmIconComponent } from './icon.component';

export const STATE_LABEL: Record<string, string> = {
  not_started: 'Not started', in_progress: 'In progress', blocked: 'Blocked', awaiting: 'Awaiting approval',
  overdue: 'Overdue', completed: 'Completed', cancelled: 'Cancelled',
};
export const STATE_ICON: Record<string, string> = {
  not_started: 'circle-dashed', in_progress: 'loader', blocked: 'ban', awaiting: 'clock',
  overdue: 'triangle-alert', completed: 'check', cancelled: 'x',
};

@Component({
  selector: 'mm-job-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MmIconComponent],
  template: `
    <button type="button" class="job-card" [attr.data-state]="state()" (click)="store.openSheet('job', job().ref)">
      <span class="card-top">
        <h3>{{ job().title }}</h3>
        @if (job().priority === 'High' || job().priority === 'Urgent') { <span class="prio" [attr.data-prio]="job().priority">{{ job().priority }}</span> }
      </span>
      <span class="meta">@if (store.role() !== job().assignee) { <span>{{ store.empName(job().assignee) }} · </span> }{{ store.deptName(job().dept) }}</span>
      <span class="foot">
        <span class="state" [attr.data-state]="state()"><mm-icon [name]="icon()" />{{ label() }}</span>
        <span class="meta due">{{ dueLine() }}@if (job().extension) { · extended }</span>
      </span>
      @if (job().state === 'blocked' && job().blockedReason) { <span class="blocked">Blocked: {{ job().blockedReason }}</span> }
      @if (job().timeRequest && state() !== 'completed') { <span class="meta">More time asked, until {{ store.fmtTime(t(job().timeRequest!.to)) }} {{ store.fmtDay(t(job().timeRequest!.to)) }}</span> }
      @if (fix(); as r) {
        <span class="returned"><mm-icon name="rotate-ccw" /><span><strong>Fix required:</strong> {{ r.reason }}@if (r.comment) {. {{ r.comment }}}@if (r.redoBy) { · redo by {{ store.fmtTime(t(r.redoBy)) }}}</span></span>
        @if (job().rejections.length > 1) { <span class="twice">Returned {{ job().rejections.length }} times</span> }
      }
    </button>
  `,
  styles: `
    :host { display: block; }
    .job-card { gap: 0.5rem; }
    .card-top { display: flex; justify-content: space-between; align-items: baseline; gap: 0.75rem; }
    .card-top h3 { font-size: 0.9375rem; font-weight: 620; line-height: 1.35; }
    .prio { font-size: var(--text-xs); font-weight: 650; flex: none; }
    .foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.25rem 0.75rem; }
    .state { display: inline-flex; align-items: center; gap: 0.375rem; font-size: var(--text-xs); font-weight: 600; color: var(--muted); }
    .state mm-icon { width: 14px; height: 14px; }
    .state[data-state="overdue"], .state[data-state="blocked"] { color: var(--red); }
    .state[data-state="awaiting"], .state[data-state="completed"] { color: var(--text); }
    .job-card[data-state="cancelled"] h3 { color: var(--muted); text-decoration: line-through; }
    .returned { display: grid; grid-template-columns: auto 1fr; gap: 0.375rem; align-items: start; font-size: var(--text-xs); color: var(--red); border-top: 1px solid var(--line); padding-top: 0.5rem; }
    .returned mm-icon { width: 14px; height: 14px; margin-top: 2px; }
    .blocked { font-size: var(--text-xs); color: var(--red); }
    .twice { font-size: var(--text-xs); font-weight: 650; color: var(--red); }
  `,
})
export class JobCardComponent {
  protected readonly store = inject(DemoStore);
  readonly job = input.required<Job>();
  protected readonly state = computed(() => this.store.derivedState(this.job()));
  protected readonly label = computed(() => STATE_LABEL[this.state()]);
  protected readonly icon = computed(() => STATE_ICON[this.state()]);
  protected readonly dueLine = computed(() => {
    const due = this.store.effectiveDue(this.job());
    if (this.state() === 'awaiting' && this.job().submittedAt) return 'Waiting ' + this.store.waitedFor(this.job().submittedAt);
    if (this.state() === 'overdue') return 'Was due ' + this.store.fmtDay(due) + ', ' + this.store.fmtTime(due);
    if (this.store.fmtDay(due) === this.store.fmtDay(this.store.now)) return 'Due today ' + this.store.fmtTime(due);
    return 'Due ' + this.store.fmtDay(due) + ', ' + this.store.fmtTime(due);
  });
  protected readonly fix = computed(() => {
    const j = this.job(); const st = this.state();
    return j.rejections.length && st !== 'completed' && st !== 'awaiting' && st !== 'cancelled' ? j.rejections[j.rejections.length - 1] : null;
  });
  protected t(iso: string): number { return Date.parse(iso); }
}
