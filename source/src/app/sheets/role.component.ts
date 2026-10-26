// The account panel (phone): who is signed in, light or dark, sign out. Signing in as someone else is how
// the demo changes seat, exactly as it will work for real.
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DemoStore } from '../core/store';
import { SheetFrameComponent } from '../ui/sheet-frame.component';
import { MmIconComponent } from '../ui/icon.component';
import { AvatarComponent } from '../ui/avatar.component';

@Component({
  selector: 'mm-role',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SheetFrameComponent, MmIconComponent, AvatarComponent],
  template: `
    <mm-sheet-frame title="Account" [active]="active()" size="compact">
      <div class="stack">
        <div class="me"><mm-avatar [name]="me()" /><span><strong>{{ me() }}</strong><br /><span class="caption muted">{{ store.seatTitle(store.role()) }}</span></span></div>
        <button type="button" class="secondary button-content" (click)="store.toggleTheme()">
          <mm-icon [name]="store.theme() === 'light' ? 'moon' : 'sun'" />{{ store.theme() === 'light' ? 'Switch to dark' : 'Switch to light' }}</button>
        <p class="caption muted">To see another person's view, sign out and sign in as them. Everyone uses the same link.</p>
      </div>
      <div actions>
        <button type="button" class="primary button-content" (click)="store.signOut()"><mm-icon name="log-out" />Sign out</button>
        <button type="button" class="cancel" (click)="store.closeSheet()">Close</button>
      </div>
    </mm-sheet-frame>
  `,
  styles: `.me { display: flex; gap: 0.875rem; align-items: center; padding: 0.5rem 0 0.75rem; }`,
})
export class RoleComponent {
  protected readonly store = inject(DemoStore);
  readonly active = input(true);
  protected readonly me = computed(() => this.store.empName(this.store.role()));
}
