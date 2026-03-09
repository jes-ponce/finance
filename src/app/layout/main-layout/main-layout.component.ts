import { Component, signal, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100">
      <app-sidebar #sidebar />

      <!-- Main content area -->
      <div class="lg:pl-64 flex flex-col min-h-screen">
        <app-header [title]="pageTitle()" (menuClick)="sidebar.toggle()" />
        <main class="flex-1 p-4 md:p-6">
          <router-outlet (activate)="onActivate($event)" />
        </main>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  @ViewChild('sidebar') sidebar!: SidebarComponent;
  pageTitle = signal('Dashboard');

  onActivate(component: any): void {
    if (component?.pageTitle) {
      this.pageTitle.set(component.pageTitle);
    }
  }
}
