import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface ScanRecord {
  id: string;
  whatsappNumber: string;
  orderId: string;
  orderName: string;
  trackingId: string;
  status: 'Success' | 'Failed' | 'Pending';
  timestamp: Date;
}

@Component({
  selector: 'app-tracking-update',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tracking-update.component.html',
  styleUrl: './tracking-update.component.scss'
})
export class TrackingUpdateComponent implements AfterViewInit {
  @ViewChild('orderIdInput') orderIdInput!: ElementRef;
  @ViewChild('trackingIdInput') trackingIdInput!: ElementRef;
  
  scanInput: string = '';
  whatsappNumber: string = '';
  orderId: string = '';
  orderName: string = '';
  trackingId: string = '';
  statusMessage: string = '';
  statusClass: string = '';
  isLoading: boolean = false;
  toastVisible: boolean = false;
  isSubmitEnabled: boolean = false;
  
  recentScans: ScanRecord[] = [];
  
  constructor(private http: HttpClient) {}
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.orderIdInput && this.orderIdInput.nativeElement) {
        this.orderIdInput.nativeElement.focus();
      }
    }, 0);
  }

  handleOrderScan(): void {
    if (this.scanInput && this.scanInput.includes('|')) {
      const parts = this.scanInput.split('|');
      if (parts.length >= 3) {
        this.whatsappNumber = parts[0]?.trim() || '';
        this.orderId = parts[1]?.trim() || '';
        this.orderName = parts[2]?.trim() || '';

        // Use setTimeout to ensure the input is enabled before focusing
        setTimeout(() => {
          if (this.trackingIdInput && this.trackingIdInput.nativeElement) {
            this.trackingIdInput.nativeElement.focus();
          }
        }, 50);
      }
    }
  }

  onTrackingIdChange(): void {
    // Enable submit button if both trackingId and orderId are provided
    this.isSubmitEnabled = !!(this.trackingId && this.trackingId.trim() !== '' && this.orderId && this.orderId.trim() !== '');
  }
  
  updateTracking(): void {
    if (!this.orderId || !this.trackingId) {
      this.showToast('Please scan both Order ID and Tracking ID', 'error');
      return;
    }
    
    this.isLoading = true;
    
    const trackingData = {
      whatsappNumber: this.whatsappNumber,
      orderId: this.orderId,
      orderName: this.orderName,
      trackingId: this.trackingId
    };
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const isWhatsappOnly = this.orderId === '1' || this.orderId === '2';
    const endpoint = isWhatsappOnly
      ? 'https://uac2oymcse.execute-api.us-east-1.amazonaws.com/send_whatsapp_only'
      : 'https://uac2oymcse.execute-api.us-east-1.amazonaws.com/submit';

    this.http.post<any>(endpoint, trackingData, { headers })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showToast('Tracking information updated successfully!', 'success');
          this.addToRecentScans('Success');
          this.clearForm();
        },
        error: (error) => {
          this.isLoading = false;
          this.showToast('Error updating tracking information. Please try again.', 'error');
          this.addToRecentScans('Failed');
          this.clearForm();
        }
      });
  }
  
  addToRecentScans(status: 'Success' | 'Failed' | 'Pending'): void {
    const newScan: ScanRecord = {
      id: Date.now().toString(),
      whatsappNumber: this.whatsappNumber,
      orderId: this.orderId,
      orderName: this.orderName,
      trackingId: this.trackingId,
      status: status,
      timestamp: new Date()
    };
    
    this.recentScans.unshift(newScan);
    if (this.recentScans.length > 5) {
      this.recentScans = this.recentScans.slice(0, 5);
    }
  }
  
  showToast(message: string, type: 'success' | 'error'): void {
    this.statusMessage = message;
    this.statusClass = type;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 1000);
  }
  
  clearForm(): void {
    this.scanInput = '';
    this.whatsappNumber = '';
    this.orderId = '';
    this.orderName = '';
    this.trackingId = '';

    setTimeout(() => {
      if (this.orderIdInput && this.orderIdInput.nativeElement) {
        this.orderIdInput.nativeElement.focus();
      }
    }, 50);
  }
}
