import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  activeSection: string = 'dashboard';
  
  constructor() { }

  ngOnInit(): void {
    // Get the current route and set the active section
    const path = window.location.pathname;
    if (path.includes('dashboard')) {
      this.activeSection = 'dashboard';
    } else if (path.includes('properties')) {
      this.activeSection = 'properties';
    } else if (path.includes('tracking')) {
      this.activeSection = 'tracking';
    } else if (path.includes('settings')) {
      this.activeSection = 'settings';
    }
  }
  
  setActiveSection(section: string): void {
    this.activeSection = section;
  }
}
