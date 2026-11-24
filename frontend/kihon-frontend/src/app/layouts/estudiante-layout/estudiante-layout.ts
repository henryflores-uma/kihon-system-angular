import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar, SidebarSection } from '../../shared/components/sidebar/sidebar';
import { Topbar } from '../../shared/components/topbar/topbar';

@Component({
  selector: 'app-estudiante-layout',
  imports: [RouterOutlet, Sidebar, Topbar],
  templateUrl: './estudiante-layout.html',
  styleUrl: './estudiante-layout.scss',
})
export class EstudianteLayout {

  isSidebarOpen = false;

  studentSections: SidebarSection[] = [
    {
      title: 'Portal estudiante',
      items: [
        { label: 'Dashboard', route: '/estudiante/dashboard' },
        { label: 'Mis grupos', route: '/estudiante/grupos' },
        { label: 'Mis asistencias', route: '/estudiante/asistencias' },
        { label: 'Mi horario', route: '/estudiante/horario' }
      ]
    }
  ];

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
}