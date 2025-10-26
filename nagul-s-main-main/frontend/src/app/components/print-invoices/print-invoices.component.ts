import { Component } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ViewChild } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-print-invoices',
  imports: [
    CommonModule,
    MatDatepickerModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatPaginatorModule
  ],
  templateUrl: './print-invoices.component.html',
  styleUrl: './print-invoices.component.scss'
})
export class PrintInvoicesComponent {
  orders: any[] = [];
  dateControl = new FormControl<Date | null>(null);
  previewVisible = false;
  isLoading = false;
  errorMessage = '';
  selectedOrderIds: any[] = [];
  previewSelectedOrders: any[] = [];
  showPreview: boolean = false;
  step: number = 1;
  hasFetched: boolean = false;
  paginatedOrders: any[][] = [];
  private printApiUrl = "https://61ydern632.execute-api.us-east-1.amazonaws.com/generate-invoice"
  isGenerating = false;
  pageSizeOptions = [15,18];
  pageSize = 15;
  currentPage = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  get pagedOrders() {
    const start = this.currentPage * this.pageSize;
    return this.orders.slice(start, start + this.pageSize);
  }

  // Helper to check if all current page items are selected
  get isAllCurrentPageSelected(): boolean {
    const currentPageOrderIds = this.pagedOrders.map(o => o['ORDER ID']);
    return currentPageOrderIds.length > 0 && currentPageOrderIds.every(id => this.selectedOrderIds.includes(id));
  }

  // Helper to check if some (but not all) current page items are selected
  get isIndeterminate(): boolean {
    const currentPageOrderIds = this.pagedOrders.map(o => o['ORDER ID']);
    const selectedInCurrentPage = currentPageOrderIds.filter(id => this.selectedOrderIds.includes(id));
    return selectedInCurrentPage.length > 0 && selectedInCurrentPage.length < currentPageOrderIds.length;
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
  }

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // On component initialization, select all current page items if there are any orders
    if (this.orders.length > 0) {
      this.selectAllCurrentPage();
    }
  }

  // Chunk orders into pages (2 per page)
  chunkOrdersForPages(orders: any[], itemsPerPage: number = 3): any[][] {
    const pages = [];
    for (let i = 0; i < orders.length; i += itemsPerPage) {
      pages.push(orders.slice(i, i + itemsPerPage));
    }
    return pages;
  }

  onSubmitDate() {
    const selectedDate = this.dateControl.value;
    if (selectedDate) {
      this.isLoading = true;
      this.errorMessage = '';
      this.hasFetched = true;
      this.step = 1;
      this.previewSelectedOrders = [];
      this.showPreview = false;
      this.previewVisible = false;
      
      const dateStr = [
        selectedDate.getFullYear(),
        String(selectedDate.getMonth() + 1).padStart(2, '0'),
        String(selectedDate.getDate()).padStart(2, '0')
      ].join('-');
      
      this.http.get<any>(`https://uac2oymcse.execute-api.us-east-1.amazonaws.com/whatsapp_orders-by-date?date=${dateStr}`)
        .subscribe({
          next: (res) => {
            if (res.success && Array.isArray(res.data)) {
              this.orders = res.data;
              // Reset pagination to first page when new data is loaded
              this.currentPage = 0;
              // Select all current page items by default
              this.selectAllCurrentPage();
              this.previewVisible = true;
            } else {
              this.orders = [];
              this.selectedOrderIds = [];
              this.previewVisible = false;
              this.errorMessage = 'No data found for the selected date.';
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error fetching orders:', error);
            this.orders = [];
            this.selectedOrderIds = [];
            this.previewVisible = false;
            this.errorMessage = 'Failed to fetch orders. Please try again.';
            this.isLoading = false;
          }
        });
    }
  }

  toggleOrderSelection(orderId: any, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const currentPageOrderIds = this.pagedOrders.map(o => o['ORDER ID']);
    
    if (checked) {
      // Check if this is the first selection on this page
      const hasCurrentPageSelections = this.selectedOrderIds.some(id => currentPageOrderIds.includes(id));
      
      if (!hasCurrentPageSelections) {
        // This is first selection on current page - clear all other selections
        this.selectedOrderIds = [orderId];
      } else {
        // Already have selections on current page - just add this one
        if (!this.selectedOrderIds.includes(orderId)) {
          this.selectedOrderIds.push(orderId);
        }
      }
    } else {
      this.selectedOrderIds = this.selectedOrderIds.filter(id => id !== orderId);
    }
  }

  // Updated method to handle only current page items
  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectAllCurrentPage();
    } else {
      this.deselectAllCurrentPage();
    }
  }

  // Helper method to select all current page items and clear others
  selectAllCurrentPage() {
    const currentPageOrderIds = this.pagedOrders.map(o => o['ORDER ID']);
    
    // Clear all previous selections and select only current page items
    this.selectedOrderIds = [...currentPageOrderIds];
  }

  // Helper method to deselect all current page items
  deselectAllCurrentPage() {
    const currentPageOrderIds = this.pagedOrders.map(o => o['ORDER ID']);
    this.selectedOrderIds = this.selectedOrderIds.filter(id => !currentPageOrderIds.includes(id));
  }

  showPreviewSection() {
    // Get all selected orders from all pages (not just current page)
    this.previewSelectedOrders = this.orders.filter(o => 
      this.selectedOrderIds.includes(o['ORDER ID'])
    );
    this.paginatedOrders = [this.previewSelectedOrders]; // Only one page at a time
    this.showPreview = true;
    this.previewVisible = true;
    this.step = 2;
  }

  goToStep(step: number) {
    this.step = step;
    if (step === 1) {
      this.showPreview = false;
      this.previewVisible = true; // Keep preview visible for step 1
      // DON'T reset pagination - keep current page
      // Update paginator UI to reflect current state without changing the page
      if (this.paginator) {
        // Set the paginator to the current page without triggering page change
        this.paginator.pageIndex = this.currentPage;
        // No need to emit page event as we're not changing the page
      }
    }
  }

  // Method to call backend and generate shipping slips PDF
  generateShippingSlips() {
    if (!this.selectedOrderIds || this.selectedOrderIds.length === 0) {
      alert('No orders selected for PDF generation.');
      return;
    }

    this.isGenerating = true;

    // Get all selected orders from all pages (not just current page)
    const selectedOrders = this.orders.filter(o => this.selectedOrderIds.includes(o['ORDER ID']));
    
    // Validate that we have valid orders
    if (!selectedOrders || selectedOrders.length === 0) {
      alert('Selected orders not found.');
      this.isGenerating = false;
      return;
    }

    // Set proper headers
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/pdf'
    });

    // Send the array directly (not wrapped in an object)
    // Your Lambda expects the orders array directly based on your handler code
    this.http.post(this.printApiUrl, selectedOrders, {
      headers: headers,
      responseType: 'blob' // IMPORTANT: Tell HttpClient to expect a binary file
    }).subscribe({
      next: (pdfBlob: Blob) => {
        try {
          // Check if the blob is actually a PDF
          if (pdfBlob.type === 'application/pdf' || pdfBlob.size > 0) {
            // Handle the PDF response
            const fileURL = URL.createObjectURL(pdfBlob);
            
            // Option 1: Open in new tab
            window.open(fileURL, '_blank');
            
            // Option 2: Download the file (uncomment if you prefer download)
            // const link = document.createElement('a');
            // link.href = fileURL;
            // link.download = `shipping-slips-${new Date().toISOString().split('T')[0]}.pdf`;
            // link.click();
            
            // Clean up the object URL
            setTimeout(() => URL.revokeObjectURL(fileURL), 100);
          } else {
            console.error('Received invalid PDF blob:', pdfBlob);
            alert('Received invalid PDF file from server.');
          }
        } catch (error) {
          console.error('Error handling PDF blob:', error);
          alert('Error processing PDF file.');
        } finally {
          this.isGenerating = false;
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error generating PDF:', err);
        
        // Better error handling
        let errorMessage = 'Failed to generate PDF.';
        
        if (err.status === 0) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.status === 400) {
          errorMessage = 'Invalid request. Please check your order data.';
        } else if (err.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (err.error) {
          // Try to read error message from blob
          if (err.error instanceof Blob) {
            err.error.text().then(text => {
              try {
                const errorObj = JSON.parse(text);
                console.error('Server error details:', errorObj);
                alert(`Server error: ${errorObj.error || 'Unknown error'}`);
              } catch {
                console.error('Server error (raw):', text);
                alert('Server error occurred.');
              }
            });
          } else {
            errorMessage = `Server error: ${err.error.error || err.message}`;
          }
        }
        
        alert(errorMessage);
        this.isGenerating = false;
      }
    });
  }
}