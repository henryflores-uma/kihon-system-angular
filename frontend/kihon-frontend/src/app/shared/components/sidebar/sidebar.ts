import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface SidebarItem {
  label: string;
  route: string;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {

  @Input() flat = false;

  @Input() sections: SidebarSection[] = [
    {
      title: 'Inicio',
      items: [
        { label: 'Dashboard', route: '/admin/admin' }
      ]
    },
    {
      title: 'Gestión',
      items: [
        { label: 'Estudiantes', route: '/admin/estudiantes' },
        { label: 'Grupos', route: '/admin/grupos' },
        { label: 'Inscripciones', route: '/admin/inscripciones' }
      ]
    },
    {
  title: 'Control',
  items: [
    { label: 'Asistencias', route: '/admin/asistencias' },
    { label: 'Horario', route: '/admin/horario' }
  ]
},
    {
      title: 'Administración',
      items: [
        { label: 'Reportes', route: '/admin/reportes' },
        { label: 'Usuarios', route: '/admin/usuarios' }
      ]
    }
  ];

  @Input() isOpen = false;

  @Output() closeMenu = new EventEmitter<void>();

  expandedSection: string | null = 'Gestión';

  toggleSection(title: string): void {
    this.expandedSection =
      this.expandedSection === title ? null : title;
  }

  onNavigate(): void {
    this.closeMenu.emit();
  }
}