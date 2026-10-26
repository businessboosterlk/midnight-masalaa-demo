import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DemoStore } from '../core/store';
import { SheetFrameComponent } from '../ui/sheet-frame.component';

@Component({
  selector: 'mm-nudge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SheetFrameComponent],
  template: `
    <mm-sheet-frame title="One check before it goes" [active]="active()" size="compact">
      <div class="panel stack">
        <div class="section-head"><h3>Completeness check</h3><span class="sample-chip">Sample</span></div>
        <p class="lead">This job asked for
          <strong [attr.data-fig]="'nudge.asked'" [attr.data-fmt]="'raw'">{{ c().asked }}</strong> items of evidence and
          <strong [attr.data-fig]="'nudge.attached'" [attr.data-fmt]="'raw'">{{ c().attached }}</strong> is attached. Submit anyway?</p>
        <p class="caption muted">The system reads the evidence line and counts what is attached. A person always decides.</p>
      </div>
      <div actions>
        <button type="button" class="primary" (click)="store.confirmNudge(jobRef())">Submit anyway</button>
        <button type="button" class="cancel" (click)="store.closeSheet()">Go back and attach the rest</button>
      </div>
    </mm-sheet-frame>
  `,
  styles: `.lead { font-size: var(--text-lg); }`,
})
export class NudgeComponent {
  protected readonly store = inject(DemoStore);
  readonly active = input(true);
  readonly jobRef = input.required<string>();
  protected readonly c = computed(() => this.store.nudgeCounts(this.jobRef()));
}
