// The door. One link for everybody: who signs in decides what they see. Demo seats only; the real build
// signs people in properly and the server decides what each role may open.
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DemoStore } from '../core/store';
import { MmIconComponent } from '../ui/icon.component';
import { AvatarComponent } from '../ui/avatar.component';

@Component({
  selector: 'mm-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MmIconComponent, AvatarComponent],
  template: `
    <main class="door">
      <div class="door-card">
        <div class="brand-row"><span class="wordmark">Midnight Masalaa</span><span class="demo">DEMO</span></div>
        <h1>Sign in</h1>
        <p class="sub">Jobs and performance, one place for every department.</p>
        <form class="form" (submit)="submit($event)">
          <label class="fld"><span>Your name</span>
            <input type="text" autocomplete="username" enterkeyhint="next" [value]="name()" (input)="name.set($any($event.target).value); err.set('')" placeholder="First name" /></label>
          <label class="fld"><span>PIN</span>
            <input type="password" inputmode="numeric" autocomplete="current-password" enterkeyhint="go" maxlength="4" [value]="pin()" (input)="pin.set($any($event.target).value); err.set('')" placeholder="4 digits" /></label>
          @if (err()) { <p class="err" role="alert"><mm-icon name="triangle-alert" />{{ err() }}</p> }
          <button type="submit" class="enter">Sign in<mm-icon name="arrow-right" /></button>
        </form>
        <div class="seats">
          <p class="seats-h">Demo seats, tap one to fill it in</p>
          @for (s of store.seats; track s.id) {
            <button type="button" class="seat" (click)="fill(s.name, s.pin)">
              <mm-avatar [name]="s.name" size="sm" />
              <span class="seat-txt"><strong>{{ s.name }}</strong><span>{{ s.title }}</span></span>
              <span class="pin">{{ s.pin }}</span>
            </button>
          }
        </div>
        <p class="foot">Everyone uses the same link. The Director sees every department; staff see only their own work.</p>
      </div>
    </main>
  `,
  styles: `
    :host { display: block; }
    .door { min-height: 100dvh; display: grid; place-items: center; padding: calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));
      background: #0b0b0c; color: #ecedef; }
    .door-card { width: min(420px, 100%); display: grid; gap: 18px; }
    .brand-row { display: flex; align-items: center; gap: 10px; }
    .wordmark { font-weight: 700; font-size: 17px; letter-spacing: -0.01em; }
    .demo { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; border: 1px solid #4a4a50; border-radius: 6px; padding: 3px 7px; color: #c9cbd2; }
    h1 { font-size: 34px; letter-spacing: -0.03em; line-height: 1.1; margin-top: 10px; }
    .sub { color: #9b9ea6; font-size: 15px; }
    .form { display: grid; gap: 12px; margin-top: 6px; }
    .fld { display: grid; gap: 6px; }
    .fld > span { font-size: 12px; font-weight: 600; color: #9b9ea6; }
    .fld input { min-height: 48px; border-radius: 12px; border: 1px solid #2e2e33; background: #151517; color: #ecedef; padding: 0 14px; font-size: 16px; }
    .fld input:focus { outline: 2px solid #ecedef; outline-offset: 2px; }
    .err { display: flex; align-items: center; gap: 8px; color: #f87171; font-size: 13px; font-weight: 600; }
    .err mm-icon { width: 16px; height: 16px; }
    .enter { min-height: 50px; border-radius: 12px; border: 0; background: #ecedef; color: #0b0b0c; font-weight: 700; font-size: 15px;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
    .enter mm-icon { width: 18px; height: 18px; }
    .seats { display: grid; gap: 8px; border-top: 1px solid #242428; padding-top: 18px; }
    .seats-h { font-size: 12px; color: #9b9ea6; font-weight: 600; }
    .seat { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; text-align: left; min-height: 56px;
      border-radius: 12px; border: 1px solid #242428; background: #151517; color: #ecedef; padding: 8px 14px; }
    .seat-txt { display: grid; } .seat-txt strong { font-size: 14px; } .seat-txt span { font-size: 12px; color: #9b9ea6; }
    .pin { font-variant-numeric: tabular-nums; font-size: 13px; color: #9b9ea6; letter-spacing: 0.1em; }
    .foot { font-size: 12px; color: #6d7077; text-align: center; }
    @media (hover: hover) { .seat:hover { border-color: #4a4a50; } .enter:hover { background: #ffffff; } }
    @media (max-width: 719px) { .door-card { text-align: center; } .brand-row { justify-content: center; } .seat, .fld { text-align: left; } }
  `,
})
export class LoginComponent {
  protected readonly store = inject(DemoStore);
  protected readonly name = signal('');
  protected readonly pin = signal('');
  protected readonly err = signal('');
  protected fill(n: string, p: string): void { this.name.set(n.split(' ')[0]); this.pin.set(p); this.err.set(''); }
  protected submit(e: Event): void {
    e.preventDefault();
    if (!this.store.signIn(this.name(), this.pin())) this.err.set('That name and PIN do not match.');
  }
}
