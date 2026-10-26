// One icon component. Paths come from lucide-static through scripts/build-icons.mjs (icons.ts is generated).
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONS } from './icons';

@Component({
  selector: 'mm-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true" focusable="false" [innerHTML]="paths()"></svg>`,
})
export class MmIconComponent {
  private readonly sanitizer = inject(DomSanitizer);
  readonly name = input.required<string>();
  protected readonly paths = computed(() => this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name()] ?? ''));
}
