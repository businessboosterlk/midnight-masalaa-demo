// Phone only: the menu items that do not fit the tab bar. What is in his brief sits apart from the add-ons.
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DemoStore } from '../core/store';
import { SheetFrameComponent } from '../ui/sheet-frame.component';
import { MmIconComponent } from '../ui/icon.component';

@Component({
  selector: 'mm-more',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SheetFrameComponent, MmIconComponent],
  template: `
    <mm-sheet-frame title="More" [active]="active()" size="compact">
      <div class="stack-lg">
        <section class="stack"><h3>In your brief</h3>
          <button type="button" class="more-item" (click)="store.nav('reports')"><mm-icon name="file-chart-column" /><span>Reports</span></button>
        </section>
        <section class="stack"><h3 class="addon-head">Add-ons <span class="addon-tag">Priced separately</span></h3>
          <button type="button" class="more-item addon" (click)="store.nav('ready')"><mm-icon name="store" /><span>Ready for service</span><span class="addon-tag">Add-on</span></button>
        </section>
      </div>
      <div actions><button type="button" class="cancel" (click)="store.closeSheet()">Close</button></div>
    </mm-sheet-frame>
  `,
  styles: `.more-item { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.75rem; text-align: left; padding: 0.75rem 1rem; }
    .more-item mm-icon { width: 20px; height: 20px; } .addon-head { display: flex; align-items: center; gap: 0.5rem; }`,
})
export class MoreComponent {
  protected readonly store = inject(DemoStore);
  readonly active = input(true);
}
