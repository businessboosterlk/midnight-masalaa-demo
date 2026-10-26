// Reassign with a reason: the Director moves a job to someone else and the history says why.
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DemoStore } from '../core/store';
import { SheetFrameComponent } from '../ui/sheet-frame.component';
import { AvatarComponent } from '../ui/avatar.component';

@Component({
  selector: 'mm-reassign',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SheetFrameComponent, AvatarComponent],
  template: `
    <mm-sheet-frame title="Reassign" [active]="active()">
      <div class="stack-lg">
        <div class="stack"><h2>{{ job().title }}</h2>
          <p class="muted">With {{ store.empName(job().assignee) }} now · {{ store.deptName(job().dept) }}</p></div>
        <section class="stack"><h3>Give it to</h3>
          <div class="people" role="group" aria-label="Give it to">
            @for (e of people(); track e.id) {
              <button type="button" class="person" [attr.aria-pressed]="to() === e.id" (click)="to.set(e.id)">
                <mm-avatar [name]="e.name" size="sm" /><span class="pn">{{ e.name }}</span><span class="load">{{ load(e.id) }}</span>
              </button>
            } @empty { <p class="muted">Nobody else in this department.</p> }
          </div>
        </section>
        <section class="stack"><h3>Why</h3>
          <div class="reason-list" role="group" aria-label="Why">
            @for (r of reasons; track r) { <button type="button" [attr.aria-pressed]="why() === r" (click)="why.set(r)">{{ r }}</button> }
          </div>
        </section>
        <p class="caption muted">The deadline stays the same. The job is scored on whoever holds it.</p>
      </div>
      <div actions>
        <button type="button" class="primary" [disabled]="!to() || !why()" (click)="store.reassign(jobRef(), to(), why())">{{ to() ? 'Reassign to ' + first() : 'Pick a person' }}</button>
        <button type="button" class="cancel" (click)="store.closeSheet()">Cancel</button>
      </div>
    </mm-sheet-frame>
  `,
  styles: `
    .people { display: grid; gap: 0.5rem; }
    .person { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.625rem; text-align: left; padding: 0.375rem 0.875rem 0.375rem 0.375rem; }
    .person[aria-pressed="true"] { border-color: var(--text); background: var(--raised); font-weight: 600; }
    .load { font-size: var(--text-xs); color: var(--muted); font-weight: 500; }
  `,
})
export class ReassignComponent {
  protected readonly store = inject(DemoStore);
  readonly active = input(true);
  readonly jobRef = input.required<string>();
  protected readonly reasons = ['On leave or off sick today', 'Needs a specialist', 'Too much on today', 'Closer to the job'];
  protected readonly to = signal('');
  protected readonly why = signal('');
  protected readonly job = computed(() => this.store.job(this.jobRef()));
  protected readonly people = computed(() => this.store.empsOf(this.job().dept).filter(e => e.id !== this.job().assignee));
  protected readonly first = computed(() => this.store.empName(this.to()).split(' ')[0]);
  protected load(id: string): string { const w = this.store.workload(id); return w.dueToday + ' due today'; }
}
