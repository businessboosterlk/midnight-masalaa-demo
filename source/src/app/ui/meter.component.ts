// A thin progress bar that DRAWS a value the store already worked out. It never prints a number itself.
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'mm-meter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="track" [class.thick]="thick()" role="presentation"><span class="fill" [style.width.%]="width()"></span></span>`,
  styles: `
    :host { display: block; }
    .track { display: block; height: 4px; border-radius: 2px; background: var(--line); overflow: hidden; }
    .track.thick { height: 8px; border-radius: 4px; }
    .fill { display: block; height: 100%; background: var(--text); border-radius: inherit; transition: width var(--motion-time) var(--ease); }
  `,
})
export class MeterComponent {
  readonly value = input<number | null>(null);
  readonly thick = input(false);
  protected readonly width = computed(() => Math.max(0, Math.min(100, this.value() ?? 0)));
}
