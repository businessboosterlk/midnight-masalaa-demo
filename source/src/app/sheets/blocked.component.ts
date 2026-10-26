// "I'm blocked": the person on the job says what is stopping them, the Director sees it in reminders.
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DemoStore } from '../core/store';
import { SheetFrameComponent } from '../ui/sheet-frame.component';

@Component({
  selector: 'mm-blocked',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SheetFrameComponent],
  template: `
    <mm-sheet-frame title="I'm blocked" [active]="active()">
      <div class="stack-lg">
        <div class="stack"><h2>{{ job().title }}</h2>
          <p class="muted">Due {{ store.fmtDay(store.effectiveDue(job())) }} at {{ store.fmtTime(store.effectiveDue(job())) }}</p></div>
        <section class="stack"><h3>What is stopping you?</h3>
          <div class="reason-list" role="group" aria-label="What is stopping you">
            @for (r of reasons; track r) { <button type="button" [attr.aria-pressed]="why() === r" (click)="why.set(r)">{{ r }}</button> }
          </div>
        </section>
        <p class="caption muted">The Director is told straight away. The deadline still stands until they move it.</p>
      </div>
      <div actions>
        <button type="button" class="primary" [disabled]="!why()" (click)="store.block(jobRef(), why())">Tell the Director</button>
        <button type="button" class="cancel" (click)="store.closeSheet()">Cancel</button>
      </div>
    </mm-sheet-frame>
  `,
})
export class BlockedComponent {
  protected readonly store = inject(DemoStore);
  readonly active = input(true);
  readonly jobRef = input.required<string>();
  protected readonly reasons = ['Waiting for parts or stock', 'Need a key or access', 'Equipment is broken', 'Need help from someone'];
  protected readonly why = signal('');
  protected readonly job = computed(() => this.store.job(this.jobRef()));
}
