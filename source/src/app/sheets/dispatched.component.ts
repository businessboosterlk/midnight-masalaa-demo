import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DemoStore } from '../core/store';
import { SheetFrameComponent } from '../ui/sheet-frame.component';
import { MmIconComponent } from '../ui/icon.component';

@Component({
  selector: 'mm-dispatched',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SheetFrameComponent, MmIconComponent],
  template: `
    <mm-sheet-frame title="Dispatched" [active]="active()" size="compact">
      <div class="done stack">
        <span class="tick"><mm-icon name="check" /></span>
        <p class="caption muted">{{ refs().length > 1 ? 'Reference numbers, one per person' : 'Reference number' }}</p>
        <p class="ref numeric">{{ job().ref }}</p>
        @if (refs().length > 1) { <p class="muted numeric">{{ refs().join(' · ') }}</p> }
        <p>{{ job().title }}</p>
        <p class="muted">Assigned to {{ names() }} in {{ store.deptName(job().dept) }}</p>
        <p class="muted">Due {{ store.fmtDay(due()) }} at {{ store.fmtTime(due()) }}</p>
        @if (job().evidence.required) { <span class="chip"><mm-icon name="camera" />{{ job().evidence.kind }}</span> }
        <p class="caption muted">{{ first() }} sees it on their phone now. Reminders follow the day before and on the deadline.</p>
      </div>
      <div actions><button type="button" class="primary" (click)="store.closeSheet()">Done</button></div>
    </mm-sheet-frame>
  `,
  styles: `
    .done { justify-items: center; text-align: center; padding: 1rem 0; }
    .tick { width: 3.5rem; height: 3.5rem; border-radius: 50%; background: var(--text); color: var(--inverse); display: grid; place-items: center; }
    .tick mm-icon { width: 1.75rem; height: 1.75rem; }
    .ref { font-size: 2.25rem; font-weight: 650; letter-spacing: -0.03em; line-height: 1; }
    .chip mm-icon { width: 14px; height: 14px; }
  `,
})
export class DispatchedComponent {
  protected readonly store = inject(DemoStore);
  readonly active = input(true);
  readonly jobRef = input.required<string>();
  protected readonly refs = computed(() => this.jobRef().split(','));
  protected readonly job = computed(() => this.store.job(this.refs()[0]));
  protected readonly names = computed(() => this.refs().map(r => this.store.empName(this.store.job(r).assignee)).join(', '));
  protected readonly due = computed(() => this.store.effectiveDue(this.job()));
  protected readonly first = computed(() => this.store.empName(this.job().assignee).split(' ')[0]);
}
