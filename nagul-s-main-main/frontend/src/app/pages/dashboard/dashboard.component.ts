import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TrackingUpdateComponent } from '../../components/tracking-update/tracking-update.component';
import { AuthService } from '../../services/auth.service';
import { WhatsappOrderFormComponent } from '../../components/whatsapp-order-form/whatsapp-order-form.component';
import { PrintInvoicesComponent } from '../../components/print-invoices/print-invoices.component';
import { ProductsViewComponent } from '../../components/products-view/products-view.component';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TrackingUpdateComponent, WhatsappOrderFormComponent, PrintInvoicesComponent, ProductsViewComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  activeSection: string = 'dashboard';
  isMobileMenuOpen: boolean = false;

  quickLinks = [
    {
      title: 'Google Sheets - Tracking Details',
      desc: 'View product delivery tracking details.',
      iconClass: 'fas fa-table',
      colorClass: '',
      url: 'https://docs.google.com/spreadsheets/d/1kiPXOVGV7mctXqrWg17GK13a9SoCsmndXa-xdFxATp4/edit?gid=0#gid=0'
    },
    {
      title: 'WhatsApp Message Delivery Details',
      desc: 'View WhatsApp messages delivery details.',
      iconClass: 'fab fa-whatsapp',
      colorClass: 'whatsapp',
      url: 'https://docs.google.com/spreadsheets/d/1UslnYopD0K682GSCv1rymTSeJTZ3uRp2VzYuwcev-p4/edit?gid=1181994735#gid=1181994735'
    },
    {
      title: 'WhatsApp Order Details',
      desc: 'View WhatsApp order details.',
      iconClass: 'fab fa-whatsapp',
      colorClass: 'whatsapp',
      url: 'https://docs.google.com/spreadsheets/d/1KLypjQ0jzfX1tCJYBG7U5sIpEV8iTTUpnA1WOhREqvo/edit?gid=519745286#gid=519745286'
    }
  ];
    
  constructor(private router: Router, private authService: AuthService) { }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  ngOnInit(): void {
  }
  
  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  logout(): void {
    this.authService.logout(); // Clear authentication state from sessionStorage
    this.router.navigate(['/login']);
  }
}
