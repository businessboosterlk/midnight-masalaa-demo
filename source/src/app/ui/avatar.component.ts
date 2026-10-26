// Initials in a circle for a person. Monochrome; no photo is invented.
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'mm-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="av" [class.sm]="size() === 'sm'" [attr.aria-hidden]="true">{{ initials() }}</span>`,
  styles: `
    :host { display: inline-flex; }
    .av { width: 2.25rem; height: 2.25rem; border-radius: 50%; display: grid; place-items: center; flex: none;
      background: var(--raised); border: 1px solid var(--line-strong); color: var(--text); font-size: 0.75rem; font-weight: 650; letter-spacing: 0.02em; }
    .av.sm { width: 1.875rem; height: 1.875rem; font-size: 0.75rem; }
  `,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly size = input<'sm' | 'md'>('md');
  protected readonly initials = computed(() => this.name().split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase());
}
