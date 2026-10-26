// The one frame every sheet uses: bottom sheet on a phone, right hand panel on a laptop, centred box when compact.
// Action bar law: one primary full width, at most one pair of equal secondaries, the quiet cancel last.
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, effect, inject, input, viewChild } from '@angular/core';
import { DemoStore } from '../core/store';
import { MmIconComponent } from './icon.component';

@Component({
  selector: 'mm-sheet-frame',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MmIconComponent],
  template: `
    <div class="sheet-backdrop" (click)="store.closeSheet()"></div>
    <section #panel class="sheet-panel" [class.wide]="size() === 'wide'" [class.compact]="size() === 'compact'"
      role="dialog" aria-modal="true" [attr.aria-label]="title()" tabindex="-1">
      <header class="sheet-head">
        <h2>{{ title() }}</h2>
        <button type="button" class="icon-button" aria-label="Close" (click)="store.closeSheet()"><mm-icon name="x" /></button>
      </header>
      <div class="sheet-body"><ng-content /></div>
      <footer class="sheet-actions"><ng-content select="[actions]" /></footer>
    </section>
  `,
  styles: `:host { display: contents; } .sheet-panel:focus { outline: none; }`,
})
export class SheetFrameComponent implements AfterViewInit {
  protected readonly store = inject(DemoStore);
  readonly title = input.required<string>();
  readonly active = input(true);
  readonly size = input<'default' | 'wide' | 'compact'>('default');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly opener = document.activeElement as HTMLElement | null;

  constructor() {
    effect(() => { if (this.active()) queueMicrotask(() => this.panel().nativeElement.focus({ preventScroll: true })); });
  }
  ngAfterViewInit(): void { this.panel().nativeElement.focus({ preventScroll: true }); }

  @HostListener('document:keydown.escape')
  protected onEscape(): void { if (this.active()) this.store.closeSheet(); }

  @HostListener('document:keydown.tab', ['$event'])
  protected trapTab(e: Event): void {
    if (!this.active()) return;
    const ev = e as KeyboardEvent; const root = this.panel().nativeElement;
    const f = [...root.querySelectorAll<HTMLElement>('button:not([disabled]),input,select,textarea,[tabindex="0"]')];
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (ev.shiftKey && document.activeElement === first) { last.focus(); ev.preventDefault(); }
    else if (!ev.shiftKey && document.activeElement === last) { first.focus(); ev.preventDefault(); }
  }
  ngOnDestroy(): void { this.opener?.focus?.({ preventScroll: true }); }
}
