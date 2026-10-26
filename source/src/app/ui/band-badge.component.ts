// The band badge. Reads the band from the store so the Excellent slider repaints it; the check reads data-overall.
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DemoStore } from '../core/store';

@Component({
  selector: 'mm-band-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="chip band" [attr.data-band]="band().key" [attr.data-bandfig]="path()"
    [attr.data-overall]="overall() ?? ''">{{ band().label }}</span>`,
  styles: `:host { display: inline-flex; }`,
})
export class BandBadgeComponent {
  private readonly store = inject(DemoStore);
  readonly overall = input<number | null>(null);
  readonly path = input('');
  protected readonly band = computed(() => this.store.bandFor(this.overall()));
}
