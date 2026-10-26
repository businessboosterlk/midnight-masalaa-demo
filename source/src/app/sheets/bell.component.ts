import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DemoStore } from '../core/store';
import { SheetFrameComponent } from '../ui/sheet-frame.component';
import { MmIconComponent } from '../ui/icon.component';

@Component({
  selector: 'mm-bell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SheetFrameComponent, MmIconComponent],
  template: `
    <mm-sheet-frame title="Reminders" [active]="active()">
      <p class="caption muted">Simulated on the frozen demo clock, {{ store.fmtDay(store.now) }} at {{ store.fmtTime(store.now) }}. The real build sends these in the app and by email.</p>
      <ul class="history">
        @for (r of items(); track $index) {
          <li class="rem"><mm-icon [name]="r.icon" /><span>{{ r.text }}<br /><span class="caption muted">{{ r.when }}</span></span></li>
        } @empty { <li class="muted">Nothing needs you right now.</li> }
      </ul>
      <div actions><button type="button" class="cancel" (click)="store.closeSheet()">Close</button></div>
    </mm-sheet-frame>
  `,
  styles: `.rem { grid-template-columns: auto 1fr; gap: 0.75rem; align-items: start; }`,
})
export class BellComponent {
  protected readonly store = inject(DemoStore);
  readonly active = input(true);
  protected readonly items = computed(() => this.store.reminders());
}
