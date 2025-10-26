import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from './products-view.component';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private baseUrl = 'http://localhost:5000/api/products'; // Node.js backend

  constructor(private http: HttpClient) {}

  fetchProducts(): Observable<{ products: Product[] }> {
    return this.http.get<{ products: Product[] }>(`${this.baseUrl}/fetch`);
  }

  addProduct(product: Product) {
    return this.http.post(`${this.baseUrl}/add`, product);
  }

  updateProduct(id: number | string, product: Product) {
    return this.http.put(`${this.baseUrl}/update/${id}`, product);
  }

  deleteProduct(id: number | string) {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
