// The frame, cast from Workshop OS: a black side menu on a laptop (brand, today strip, menu with counts,
// the signed-in person at the foot), a light page beside it, a top bar and a tab bar on a phone.
// Signed out, the door is all there is.
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, effect, inject } from '@angular/core';
import { DemoStore, ScreenKey } from '../core/store';
import { MmIconComponent } from '../ui/icon.component';
import { AvatarComponent } from '../ui/avatar.component';
import { LoginComponent } from '../screens/login.component';
import { HomeComponent } from '../screens/home.component';
import { JobsComponent } from '../screens/jobs.component';
import { ApprovalsComponent } from '../screens/approvals.component';
import { ScoreboardComponent } from '../screens/scoreboard.component';
import { MydayComponent } from '../screens/myday.component';
import { MyscoreComponent } from '../screens/myscore.component';
import { AssignComponent } from '../sheets/assign.component';
import { DispatchedComponent } from '../sheets/dispatched.component';
import { JobComponent } from '../sheets/job.component';
import { NudgeComponent } from '../sheets/nudge.component';
import { ApproveComponent } from '../sheets/approve.component';
import { RejectComponent } from '../sheets/reject.component';
import { DrillComponent } from '../sheets/drill.component';
import { RoleComponent } from '../sheets/role.component';
import { BellComponent } from '../sheets/bell.component';
import { ReassignComponent } from '../sheets/reassign.component';
import { BlockedComponent } from '../sheets/blocked.component';
import { MoretimeComponent } from '../sheets/moretime.component';
import { MoreComponent } from '../sheets/more.component';
import { ReportsComponent } from '../screens/reports.component';
import { ReadyComponent } from '../screens/ready.component';

type NavItem = { page: ScreenKey; label: string; icon: string; count?: 'overdue' | 'awaiting'; addon?: boolean };
const TITLES: Record<ScreenKey, string> = { home: 'Today', jobs: 'Jobs', approvals: 'Approvals', scoreboard: 'Scores', myday: 'My day', myscore: 'My score', reports: 'Reports', ready: 'Ready for service' };

@Component({
  selector: 'mm-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MmIconComponent, AvatarComponent, LoginComponent, HomeComponent, JobsComponent, ApprovalsComponent,
    ScoreboardComponent, MydayComponent, MyscoreComponent, AssignComponent, DispatchedComponent, JobComponent,
    NudgeComponent, ApproveComponent, RejectComponent, DrillComponent, RoleComponent, BellComponent, ReassignComponent, BlockedComponent, MoretimeComponent, MoreComponent, ReportsComponent, ReadyComponent],
  template: `
    @if (!store.signedIn()) {
      <mm-login />
    } @else {
    <div class="frame" [attr.inert]="hasSheets() ? '' : null">
      <aside class="side" aria-label="Main menu">
        <div class="side-brand">
          <div class="side-name">Midnight Masalaa <span class="side-demo">DEMO</span></div>
          <div class="strip" aria-hidden="true">
            @for (d of strip(); track d.key) { <span class="seg" [attr.data-band]="d.band" [title]="d.name"></span> }
          </div>
          @if (store.role() === 'director') { <p class="side-line"><strong [attr.data-fig]="'counts.overdue'" [attr.data-fmt]="'int'">{{ c().overdue }}</strong> overdue ·
            <strong [attr.data-fig]="'counts.awaiting'" [attr.data-fmt]="'int'">{{ c().awaiting }}</strong> to approve</p> }
          <p class="side-time">{{ store.fmtTime(store.now) }} · {{ store.fmtDay(store.now) }}</p>
        </div>
        <nav class="menu">
          @if (addons().length) { <p class="menu-group">In your brief</p> }
          @for (item of navigation(); track item.page) {
            <button type="button" class="nav-item" [attr.aria-current]="store.screen() === item.page ? 'page' : null" (click)="store.nav(item.page)">
              <mm-icon [name]="item.icon" /><span class="nav-label">{{ item.label }}</span>
              @if (item.count && c()[item.count]) { <span class="nav-count" [class.warn]="item.count === 'overdue'" [attr.data-fig]="'counts.' + item.count" [attr.data-fmt]="'int'">{{ c()[item.count] }}</span> }
            </button>
          }
          @if (addons().length) {
            <p class="menu-group addon-group">Add-ons <span>priced separately</span></p>
            @for (item of addons(); track item.page) {
              <button type="button" class="nav-item addon" [attr.aria-current]="store.screen() === item.page ? 'page' : null" (click)="store.nav(item.page)">
                <mm-icon [name]="item.icon" /><span class="nav-label">{{ item.label }}</span>
              </button>
            }
          }
        </nav>
        <div class="side-foot">
          <mm-avatar [name]="me()" size="sm" />
          <span class="me"><strong>{{ me() }}</strong><span>{{ store.seatTitle(store.role()) }}</span></span>
          <button type="button" class="foot-btn" [attr.aria-label]="store.theme() === 'light' ? 'Switch to dark' : 'Switch to light'" (click)="store.toggleTheme()">
            <mm-icon [name]="store.theme() === 'light' ? 'moon' : 'sun'" /></button>
          <button type="button" class="foot-btn" aria-label="Sign out" (click)="store.signOut()"><mm-icon name="log-out" /></button>
        </div>
      </aside>

      <div class="page">
        <header class="app-topbar">
          <div class="crumb"><strong>{{ title() }}</strong><span>Midnight Masalaa · {{ me() }}</span></div>
          <div class="phone-brand"><span>Midnight Masalaa</span><span class="side-demo">DEMO</span></div>
          <div class="top-actions">
            <button type="button" class="icon-button" aria-label="Open reminders" (click)="store.openSheet('bell')"><mm-icon name="bell" /></button>
            <button type="button" class="icon-button phone-only-acc" aria-label="Account" (click)="store.openSheet('role')"><mm-avatar [name]="me()" size="sm" /></button>
          </div>
        </header>
        <main id="main-content" class="main-content" tabindex="-1">
          @switch (store.screen()) {
            @case ('home') { <mm-home /> }
            @case ('jobs') { <mm-jobs /> }
            @case ('approvals') { <mm-approvals /> }
            @case ('scoreboard') { <mm-scoreboard /> }
            @case ('myday') { <mm-myday /> }
            @case ('myscore') { <mm-myscore /> }
            @case ('reports') { <mm-reports /> }
            @case ('ready') { <mm-ready /> }
          }
        </main>
      </div>

      <nav class="bottom-nav" aria-label="Main menu">
        @for (item of phoneNav(); track item.page) {
          <button type="button" [attr.aria-current]="store.screen() === item.page ? 'page' : null" (click)="store.nav(item.page)">
            <span class="bn-icon"><mm-icon [name]="item.icon" />
              @if (item.count && c()[item.count]) { <span class="nav-dot" [class.warn]="item.count === 'overdue'" [attr.data-fig]="'counts.' + item.count" [attr.data-fmt]="'int'">{{ c()[item.count] }}</span> }</span>
            <span>{{ item.label }}</span>
          </button>
        }
        @if (addons().length) {
          <button type="button" [attr.aria-current]="store.screen() === 'reports' || store.screen() === 'ready' ? 'page' : null" (click)="store.openSheet('more')">
            <span class="bn-icon"><mm-icon name="ellipsis" /></span><span>More</span></button>
        }
      </nav>
    </div>

    <div class="toast" role="status" aria-live="polite" [class.on]="!!store.toastMessage()" [class.has-undo]="!!store.toastUndo()">
      <span>{{ store.toastMessage() }}</span>
      @if (store.toastUndo()) { <button type="button" class="toast-undo" (click)="store.undoLast()">Undo</button> }
    </div>

    @if (hasSheets()) {
      <div class="sheet-stack">
        @for (sheet of store.sheets(); track $index; let top = $last) {
          <div class="sheet-layer" [attr.inert]="top ? null : ''" [attr.aria-hidden]="top ? null : 'true'">
            @switch (sheet.name) {
              @case ('assign') { <mm-assign [active]="top" [jobRef]="sheet.param ?? ''" /> }
              @case ('dispatched') { <mm-dispatched [active]="top" [jobRef]="sheet.param ?? ''" /> }
              @case ('job') { <mm-job [active]="top" [jobRef]="sheet.param ?? ''" /> }
              @case ('nudge') { <mm-nudge [active]="top" [jobRef]="sheet.param ?? ''" /> }
              @case ('approve') { <mm-approve [active]="top" [jobRef]="sheet.param ?? ''" /> }
              @case ('reject') { <mm-reject [active]="top" [jobRef]="sheet.param ?? ''" /> }
              @case ('drill') { <mm-drill [active]="top" [scope]="sheet.param ?? 'company'" /> }
              @case ('role') { <mm-role [active]="top" /> }
              @case ('bell') { <mm-bell [active]="top" /> }
              @case ('reassign') { <mm-reassign [active]="top" [jobRef]="sheet.param ?? ''" /> }
              @case ('blocked') { <mm-blocked [active]="top" [jobRef]="sheet.param ?? ''" /> }
              @case ('more') { <mm-more [active]="top" /> }
              @case ('moretime') { <mm-moretime [active]="top" [jobRef]="sheet.param ?? ''" /> }
            }
          </div>
        }
      </div>
    }
    }
  `,
})
export class ShellComponent {
  protected readonly store = inject(DemoStore);
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly hasSheets = computed(() => this.store.sheets().length > 0);
  protected readonly c = computed(() => this.store.counts());
  protected readonly me = computed(() => this.store.empName(this.store.role()));
  protected readonly title = computed(() => TITLES[this.store.screen()]);
  // the today strip: one segment per department, shaded by its band (red only for a band that needs help)
  protected readonly strip = computed(() => this.store.departments.map(d => {
    const b = this.store.bandFor(this.store.score({ dept: d.key }).overall).key;
    return { key: d.key, name: d.name, band: b };
  }));
  protected readonly navigation = computed<NavItem[]>(() => this.store.role() === 'director'
    ? [
      { page: 'home', label: 'Today', icon: 'layout-dashboard' },
      { page: 'jobs', label: 'Jobs', icon: 'clipboard-list', count: 'overdue' },
      { page: 'approvals', label: 'Approvals', icon: 'check-check', count: 'awaiting' },
      { page: 'scoreboard', label: 'Scores', icon: 'chart-no-axes-combined' },
      { page: 'reports', label: 'Reports', icon: 'file-chart-column' },
    ]
    : [
      { page: 'myday', label: 'My day', icon: 'clipboard-list' },
      { page: 'jobs', label: 'My jobs', icon: 'clipboard-list' },
      { page: 'myscore', label: 'My score', icon: 'chart-no-axes-combined' },
    ]);

  // the add-ons: BB modules beyond his brief, shown in their own colour so the quote can price them apart
  protected readonly addons = computed<NavItem[]>(() => this.store.role() === 'director' ? [{ page: 'ready', label: 'Ready for service', icon: 'store', addon: true }] : []);
  // the phone tab bar keeps his four; Reports and the add-ons sit under More
  protected readonly phoneNav = computed(() => this.navigation().filter(i => i.page !== 'reports'));

  constructor() {
    effect(onCleanup => {
      const open = this.hasSheets();
      if (!this.browser || !open) return;
      const old = this.document.body.style.overflow;
      this.document.body.style.overflow = 'hidden';
      onCleanup(() => { this.document.body.style.overflow = old; });
    });
  }
}
