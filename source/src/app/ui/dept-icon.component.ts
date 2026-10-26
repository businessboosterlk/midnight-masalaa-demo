// A department's icon in a rounded tile.
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MmIconComponent } from './icon.component';
import { deptIcon } from './dept';

@Component({
  selector: 'mm-dept-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MmIconComponent],
  template: `<span class="tile" [class.sm]="size() === 'sm'"><mm-icon [name]="icon()" /></span>`,
  styles: `
    :host { display: inline-flex; }
    .tile { width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; display: grid; place-items: center; flex: none;
      color: var(--muted); }
    .tile mm-icon { width: 1.25rem; height: 1.25rem; }
    .tile.sm { width: 2rem; height: 2rem; border-radius: 0.625rem; }
    .tile.sm mm-icon { width: 1rem; height: 1rem; }
  `,
})
export class DeptIconComponent {
  readonly dept = input.required<string>();
  readonly size = input<'sm' | 'md'>('md');
  protected readonly icon = computed(() => deptIcon(this.dept()));
}
