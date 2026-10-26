// ADD-ON: Ready for service. Each outlet answers "what could stop the next service, who is on it, what must I decide".
// The checks are sample supervisor reports (core/outlets.ts); the jobs are the live jobs that name the outlet.
// A failed check becomes a real job in one tap. Unknown is its own state: no report never means Ready.
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DemoStore } from '../core/store';
import { MmIconComponent } from '../ui/icon.component';
import { STATE_LABEL } from '../ui/job-card.component';

const CHECK_ICON: Record<string, string> = { ok: 'circle-check', failed: 'circle-x', unknown: 'circle-help' };
const READY_LABEL = { ready: 'Ready', risk: 'At risk', unknown: 'Not reported' } as const;

@Component({
  selector: 'mm-ready',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MmIconComponent],
  template: `
    <div class="addon-banner"><span class="addon-tag">Add-on</span><span>Not in your brief. Shown so you can see where the system can go; priced separately.</span></div>
    <header class="page-heading"><div><h1>Ready for service</h1><p>What could stop the next service, who is on it and what you need to decide. Sample outlet checks.</p></div></header>

    <section class="tally" aria-label="Outlets">
      @for (t of tally(); track t.key) {
        <button type="button" class="tile" [attr.data-ready]="t.key" [attr.aria-pressed]="show() === t.key" (click)="show.set(show() === t.key ? '' : t.key)">
          <strong class="numeric">{{ t.n }}</strong><span>{{ t.label }}</span></button>
      }
    </section>

    <div class="outlets">
      @for (o of shown(); track o.key) {
        <section class="panel outlet stack" [attr.data-ready]="o.r.state" [attr.aria-label]="o.name">
          <div class="o-head"><div><h2>{{ o.name }}</h2><p class="caption muted">{{ o.service }}</p></div>
            <span class="rstate" [attr.data-ready]="o.r.state">{{ label[o.r.state] }}</span></div>
          <ul class="checks">
            @for (c of o.checks; track c.text; let i = $index) {
              <li [attr.data-check]="c.state">
                <mm-icon [name]="icon[c.state]" />
                <span class="ct"><span>{{ c.text }}</span>
                  @if (c.state === 'ok') { <span class="caption muted">{{ c.by }}, {{ c.at }}</span> }
                  @if (c.state === 'unknown') { <span class="caption muted">Not reported yet</span> }
                  @if (c.state === 'failed') { <span class="caption">{{ c.note }}</span> }
                </span>
                @if (c.state === 'failed') {
                  @if (store.checkJob(o.key, i); as j) {
                    <button type="button" class="quiet-link" (click)="store.openSheet('job', j.ref)">{{ j.ref }} · {{ stateLabel(j) }}</button>
                  } @else {
                    <button type="button" class="secondary make" (click)="store.openSheet('assign', 'ready:' + o.key + ':' + i)">Make it a job</button>
                  }
                }
              </li>
            }
          </ul>
          @if (o.r.unknown) { <button type="button" class="secondary" (click)="store.nudgeOutlet(o.name)">Ask {{ o.name }} for the missing checks</button> }
          @if (o.jobs.length) {
            <div class="ojobs"><h3>Open jobs here</h3>
              @for (j of o.jobs; track j.ref) {
                <button type="button" class="ojob" (click)="store.openSheet('job', j.ref)">
                  <span class="oj-t">{{ j.title }}</span>
                  <span class="oj-s" [attr.data-state]="store.derivedState(j)">{{ stateLabel(j) }} · {{ store.empName(j.assignee) }}</span></button>
              }
            </div>
          }
        </section>
      }
    </div>
    <p class="caption muted foot">Jobs are matched to an outlet by its name in the job title. The real build gives every job a location. The checks come from each supervisor's phone before service.</p>
  `,
  styles: `
    .tally { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; margin-bottom: 1.25rem; }
    .tile { display: grid; gap: 0.25rem; justify-items: start; text-align: left; padding: 1rem 1.125rem; background: var(--surface); border-radius: var(--radius-md); }
    .tile strong { font-size: 1.75rem; font-weight: 700; line-height: 1; }
    .tile span { color: var(--muted); font-size: var(--text-sm); }
    .tile[data-ready="risk"] strong { color: var(--red); }
    .tile[aria-pressed="true"] { border-color: var(--text); box-shadow: inset 0 0 0 1px var(--text); }
    .outlets { display: grid; grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr)); gap: 1rem; align-items: start; }
    .outlet[data-ready="risk"] { border-color: var(--red); }
    .o-head { display: flex; justify-content: space-between; align-items: start; gap: 0.75rem; }
    .rstate { font-size: var(--text-xs); font-weight: 650; padding: 0.25rem 0.625rem; border-radius: 999px; border: 1px solid var(--line-strong); white-space: nowrap; }
    .rstate[data-ready="ready"] { background: var(--text); color: var(--inverse); border-color: var(--text); }
    .rstate[data-ready="risk"] { background: var(--red-soft); color: var(--red); border-color: var(--red); }
    .rstate[data-ready="unknown"] { border-style: dashed; }
    .checks { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
    .checks li { display: grid; grid-template-columns: auto 1fr auto; gap: 0.625rem; align-items: center; min-height: 44px; }
    .checks mm-icon { width: 18px; height: 18px; color: var(--muted); }
    .checks li[data-check="ok"] mm-icon { color: var(--text); }
    .checks li[data-check="failed"] mm-icon, .checks li[data-check="failed"] .caption { color: var(--red); }
    .ct { display: grid; gap: 0.125rem; min-width: 0; }
    .make { min-height: 44px; padding: 0.375rem 0.75rem; font-size: var(--text-sm); }
    .quiet-link { border: 0; background: none; padding: 0 0.25rem; min-height: 44px; text-decoration: underline; text-underline-offset: 0.2em; font-size: var(--text-xs); }
    .ojobs { display: grid; gap: 0.5rem; border-top: 1px solid var(--line); padding-top: 0.75rem; }
    .ojobs h3 { font-size: var(--text-xs); color: var(--muted); font-weight: 650; }
    .ojob { display: grid; gap: 0.125rem; text-align: left; padding: 0.5rem 0.75rem; }
    .oj-t { font-weight: 600; font-size: var(--text-sm); }
    .oj-s { font-size: var(--text-xs); color: var(--muted); }
    .oj-s[data-state="overdue"], .oj-s[data-state="blocked"] { color: var(--red); font-weight: 600; }
    .foot { margin-top: 1.25rem; }
    @media (max-width: 767px) { .outlets { grid-template-columns: 1fr; } .tile { padding: 0.75rem; } }
  `,
})
export class ReadyComponent {
  protected readonly store = inject(DemoStore);
  protected readonly label = READY_LABEL;
  protected readonly icon = CHECK_ICON;
  protected readonly show = signal('');
  // outlets at risk first, then not reported, then ready
  protected readonly all = computed(() => {
    this.store.jobs(); const order = { risk: 0, unknown: 1, ready: 2 };
    return this.store.outlets.map(o => ({ ...o, r: this.store.readiness(o.key), jobs: this.store.outletJobs(o.key) }))
      .sort((a, b) => order[a.r.state] - order[b.r.state]);
  });
  protected readonly shown = computed(() => this.all().filter(o => !this.show() || o.r.state === this.show()));
  protected readonly tally = computed(() => (['risk', 'unknown', 'ready'] as const).map(k => ({ key: k, label: READY_LABEL[k], n: this.all().filter(o => o.r.state === k).length })));
  protected stateLabel(j: { state: string }): string { return STATE_LABEL[this.store.derivedState(j as any)]; }
}
