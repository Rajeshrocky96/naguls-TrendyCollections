import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-whatsapp-order-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './whatsapp-order-form.component.html',
  styleUrls: ['./whatsapp-order-form.component.scss']
})
export class WhatsappOrderFormComponent implements OnInit {
  orderForm: FormGroup;
  toastVisible = false;
  toastMessage = '';
  toastStatusClass = '';
  isLoading = false;
  maxDate = new Date();
  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.orderForm = this.fb.group({
      orderDate: [new Date(), Validators.required],
      orderSource: ['WhatsApp', Validators.required],
      customerName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      deliveryAddress: ['', Validators.required],
      specialInstructions: [''],
      products: this.fb.array([
        this.fb.group({
          productCode: [''],
          quantity: ['']
        })
      ])
    });
  }

  ngOnInit(): void {}

  get products(): FormArray {
    return this.orderForm.get('products') as FormArray;
  }

  createProductGroup(): FormGroup {
    return this.fb.group({
      productCode: [''],
      quantity: ['']
    });
  }

  addProduct(): void {
    this.products.push(this.createProductGroup());
  }

  removeProduct(index: number): void {
    if (this.products.length > 1) {
      this.products.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.orderForm.valid) {
      const raw = this.orderForm.getRawValue();
      const dateStr = [
        raw.orderDate.getFullYear(),
        String(raw.orderDate.getMonth() + 1).padStart(2, '0'),
        String(raw.orderDate.getDate()).padStart(2, '0')
      ].join('-');
      console.log(dateStr)
      // Filter out products with missing productCode or quantity
      const filteredProducts = (raw.products || []).filter((p: any) => p.productCode && p.quantity);
      const orderData = {
        ...raw,
        orderDate: dateStr,
        products: filteredProducts
      };
      this.isLoading = true;
      this.http.post('https://uac2oymcse.execute-api.us-east-1.amazonaws.com/submit_whatsapp_order', orderData)
        .subscribe({
          next: () => { this.showToast('Order is saved', 'success'); this.isLoading = false; this.onReset()},
          error: () => { this.showToast('Failed to save order', 'error'); this.isLoading = false; }
        });
    } else {
      this.orderForm.markAllAsTouched();
    }
  }

  showToast(message: string, status: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastStatusClass = status;
    this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3000);
  }

  onReset(): void {
    this.orderForm.reset();
    while (this.products.length > 1) {
      this.products.removeAt(1);
    }
    this.orderForm.patchValue({
      orderDate: new Date(),
      orderSource: 'WhatsApp'
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  hasError(fieldName: string): boolean {
    const control = this.orderForm.get(fieldName);
    return !!(control?.errors && control?.touched);
  }

  hasProductError(index: number, fieldName: string): boolean {
    const control = this.products.at(index).get(fieldName);
    return !!(control?.errors && control?.touched);
  }
}
