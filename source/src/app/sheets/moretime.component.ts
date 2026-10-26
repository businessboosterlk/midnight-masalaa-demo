// Ask for more time: the person proposes a new deadline and says why. Only the Director's yes moves it.
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DemoStore } from '../core/store';
import { SheetFrameComponent } from '../ui/sheet-frame.component';

@Component({
  selector: 'mm-moretime',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SheetFrameComponent],
  template: `
    <mm-sheet-frame title="Ask for more time" [active]="active()">
      <div class="stack-lg">
        <div class="stack"><h2>{{ job().title }}</h2>
          <p class="muted">Due now {{ store.fmtDay(due()) }} at {{ store.fmtTime(due()) }}</p></div>
        <div class="field"><span>New deadline</span>
          <div class="segmented" role="group" aria-label="New deadline">
            @for (o of options(); track o.key) { <button type="button" [attr.aria-pressed]="to() === o.key" (click)="to.set(o.key)"><span>{{ o.label }}</span><span class="r2">{{ o.when }}</span></button> }
          </div></div>
        <section class="stack"><h3>Why</h3>
          <div class="reason-list" role="group" aria-label="Why">
            @for (r of reasons; track r) { <button type="button" [attr.aria-pressed]="why() === r" (click)="why.set(r)">{{ r }}</button> }
          </div>
        </section>
        <p class="caption muted">The Director decides. Until then the current deadline stands.</p>
      </div>
      <div actions>
        <button type="button" class="primary" [disabled]="!why()" (click)="send()">Send to the Director</button>
        <button type="button" class="cancel" (click)="store.closeSheet()">Cancel</button>
      </div>
    </mm-sheet-frame>
  `,
  styles: `.segmented { display: grid; grid-template-columns: repeat(3, 1fr); } .segmented button { display: grid; gap: 0.125rem; padding: 0.5rem 0.25rem; line-height: 1.25; }
    .r2 { font-variant-numeric: tabular-nums; font-size: var(--text-xs); opacity: 0.8; }`,
})
export class MoretimeComponent {
  protected readonly store = inject(DemoStore);
  readonly active = input(true);
  readonly jobRef = input.required<string>();
  protected readonly reasons = ['Waiting for parts or stock', 'Bigger job than expected', 'Needed on something urgent first'];
  protected readonly to = signal('2h');
  protected readonly why = signal('');
  protected readonly job = computed(() => this.store.job(this.jobRef()));
  // proposals start from the later of the deadline and now, so a request is never for a time already gone
  protected readonly due = computed(() => this.store.effectiveDue(this.job()));
  protected readonly options = computed(() => {
    const from = Math.max(this.due(), this.store.now); const w = (ms: number) => this.store.fmtDay(ms) + ', ' + this.store.fmtTime(ms);
    return [{ key: '2h', label: '2 more hours', ms: from + 2 * 3600e3 }, { key: '1d', label: 'One more day', ms: from + 864e5 }, { key: '2d', label: 'Two more days', ms: from + 2 * 864e5 }]
      .map(o => ({ ...o, when: w(o.ms) }));
  });
  protected send(): void { const o = this.options().find(x => x.key === this.to()); if (o) this.store.requestTime(this.jobRef(), new Date(o.ms).toISOString(), this.why()); }
}
