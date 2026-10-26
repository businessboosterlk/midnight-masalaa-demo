// A score ring drawn with a conic gradient (no hand drawn svg). The number inside is projected in
// by the caller so it keeps its data-fig for the recompute check.
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'mm-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="ring" [style.--p]="pct()" [style.--d]="size() + 'px'"><span class="hole"><ng-content /></span></span>`,
  styles: `
    :host { display: inline-flex; }
    .ring { --p: 0; width: var(--d); height: var(--d); border-radius: 50%; display: grid; place-items: center;
      background: conic-gradient(var(--text) calc(var(--p) * 1%), var(--line) 0); }
    .hole { width: calc(var(--d) - 14px); height: calc(var(--d) - 14px); border-radius: 50%; background: var(--surface);
      display: grid; place-items: center; align-content: center; gap: 0.125rem; text-align: center; }
  `,
})
export class RingComponent {
  readonly value = input<number | null>(null);
  readonly size = input(132);
  protected readonly pct = computed(() => Math.max(0, Math.min(100, this.value() ?? 0)));
}
