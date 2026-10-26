import { bootstrapApplication } from '@angular/platform-browser';
import { provideZoneChangeDetection } from '@angular/core';
import { ShellComponent } from './app/shell/shell.component';

bootstrapApplication(ShellComponent, { providers: [provideZoneChangeDetection({ eventCoalescing: true })] })
  .catch(err => console.error(err));
