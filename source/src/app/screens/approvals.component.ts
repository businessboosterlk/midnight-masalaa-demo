// src/app/screens/approvals.component.ts
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DemoStore } from '../core/store';
import { MmIconComponent } from '../ui/icon.component';
import { EvidencePhotoComponent } from '../ui/evidence-photo.component';
import { AvatarComponent } from '../ui/avatar.component';
import { DeptIconComponent } from '../ui/dept-icon.component';

@Component({
  selector: 'mm-approvals',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MmIconComponent, EvidencePhotoComponent, AvatarComponent, DeptIconComponent],
  template: `
    <header class="page-heading"><div><h1>Waiting your approval</h1>
      <p><span [attr.data-fig]="'counts.awaiting'" [attr.data-fmt]="'int'">{{ counts().awaiting }}</span> submitted jobs. Review the evidence before deciding.</p>
    </div></header>

    @if (store.role() !== 'director') {
      <div class="empty"><h2>Director view</h2><p>Switch demo role to review submitted work.</p>
        <button type="button" (click)="store.openSheet('role')">Switch demo role</button>
      </div>
    } @else {
    @if (selected(); as job) {
      <div class="approval-layout">
        <div class="queue-col">
        @if (depts().length > 1) {
          <span class="select-wrap qfilter">
            <select aria-label="Department" (change)="dept.set(val($event))">
              <option value="" [selected]="!dKey()">All departments</option>
              @for (d of depts(); track d.key) { <option [value]="d.key" [selected]="dKey() === d.key">{{ d.name }}</option> }
            </select><mm-icon name="chevron-down" /></span>
        }
        <nav class="approval-queue" aria-label="Submitted jobs">
          @for (item of queue(); track item.ref) {
            <button type="button" class="queue-item" [attr.aria-current]="item.ref === job.ref ? 'true' : null"
              (click)="selectedRef.set(item.ref)">
              <span class="caption muted">{{ item.ref }}</span><strong>{{ item.title }}</strong>
              <span class="qwho"><mm-avatar [name]="store.empName(item.assignee)" size="sm" /><span class="caption muted">{{ store.empName(item.assignee) }}</span></span>
              <span class="caption qwait"><mm-icon name="clock" aria-hidden="true" />Waiting {{ store.waitedFor(item.submittedAt) }} · {{ item.photos.length }} {{ item.photos.length === 1 ? 'photo' : 'photos' }}</span>
            </button>
          }
        </nav>
        </div>

        <article class="panel stack-lg" aria-labelledby="approval-job-title">
          <header class="stack"><p class="caption muted dhead"><mm-dept-icon [dept]="job.dept" size="sm" />{{ job.ref }} · {{ store.deptName(job.dept) }}</p>
            <h2 id="approval-job-title">{{ job.title }}</h2>
            <p class="muted">Submitted by {{ store.empName(job.assignee) }}</p>
          </header>
          <div class="approval-comparison">
            <section class="stack" aria-labelledby="requirement-title">
              <h3 id="requirement-title">What was asked for</h3><p class="job-description">{{ job.desc }}</p>
              <div class="requirement stack">
                <strong>Evidence requested</strong><p>{{ job.evidence.kind }}</p>
                <span class="caption muted">{{ job.evidence.required ? 'Photo evidence required' : 'Photo evidence optional' }}</span>
              </div>
              <p class="caption muted">Due {{ store.fmtDay(store.effectiveDue(job)) }} at {{ store.fmtTime(store.effectiveDue(job)) }}</p>
              <button type="button" class="secondary" (click)="store.openSheet('job', job.ref)">View job history</button>
            </section>
            <section class="stack" aria-labelledby="evidence-title">
              <h3 id="evidence-title">What was submitted</h3>
              @for (photo of job.photos; track $index) { <mm-evidence-photo [photo]="photo" /> }
              @empty { <div class="empty"><mm-icon name="image-off" aria-hidden="true" /><p>No photo attached</p></div> }
            </section>
          </div>
          <footer class="decision-actions">
            <button type="button" class="primary button-content" (click)="store.openSheet('approve', job.ref)">
              <mm-icon name="check" aria-hidden="true" />Rate and approve
            </button>
            <button type="button" class="secondary button-content" (click)="store.openSheet('reject', job.ref)">
              <mm-icon name="rotate-ccw" aria-hidden="true" />Reject with a reason
            </button>
            <p class="caption muted">Work stays awaiting approval until you confirm a decision.</p>
          </footer>
        </article>
      </div>
    } @else {
      <div class="panel empty"><mm-icon name="check-check" aria-hidden="true" /><h2>Nothing waiting</h2>
        <p>New submissions will appear here for your review.</p>
        <button type="button" (click)="store.nav('home')">Back to today</button>
      </div>
    }
    }
  `,
  styles: `
    .queue-item { display: grid; gap: 0.625rem; justify-items: start; text-align: left; padding: 1rem; }
    .queue-item[aria-current="true"] { border-color: var(--text); background: var(--raised); }
    .qwait { display: inline-flex; align-items: center; gap: 0.375rem; color: var(--muted); } .qwait mm-icon { width: 14px; height: 14px; }
    .queue-col { display: grid; gap: 0.75rem; align-content: start; min-width: 0; }
    .qwho, .dhead { display: flex; align-items: center; gap: 0.5rem; }
    .queue-item strong { overflow-wrap: anywhere; }
    .requirement { padding: 1rem; border: 1px solid var(--line); border-radius: var(--radius-sm); }
    .job-description { white-space: pre-line; overflow-wrap: anywhere; }
    .decision-actions { display: grid; gap: 0.75rem; border-top: 1px solid var(--line); padding-top: 1rem; }
    .decision-actions p { text-align: center; }
    @media (max-width: 767px) {
      .approval-queue { display: flex; overflow-x: auto; gap: 0.75rem; padding: 0.25rem 0.25rem 0.75rem; scroll-snap-type: x proximity; }
      .queue-item { flex: 0 0 82%; scroll-snap-align: start; }
      .decision-actions { position: sticky; bottom: calc(5.5rem + env(safe-area-inset-bottom)); background: var(--surface); padding: 0.875rem 0; }
      #approval-job-title { text-align: center; }
    }
  `
})
export class ApprovalsComponent {
  protected readonly store = inject(DemoStore);
  protected readonly counts = computed(() => this.store.counts());
  protected readonly selectedRef = signal<string | null>(null);
  protected readonly dept = signal('');
  protected readonly depts = computed(() => this.store.departments.filter(d => this.store.approvalQueue().some(j => j.dept === d.key)));
  // a department that has nothing left waiting falls back to all, so the filter can never strand the queue
  protected readonly dKey = computed(() => this.depts().some(d => d.key === this.dept()) ? this.dept() : '');
  protected readonly queue = computed(() => this.store.approvalQueue().filter(j => !this.dKey() || j.dept === this.dKey()));
  protected val(e: Event): string { return (e.target as HTMLSelectElement).value; }
  protected readonly selected = computed(() =>
    this.queue().find(job => job.ref === this.selectedRef()) ?? this.queue()[0] ?? null);
}
