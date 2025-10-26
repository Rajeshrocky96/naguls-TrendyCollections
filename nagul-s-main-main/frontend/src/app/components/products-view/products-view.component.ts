import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ProductsService } from './product-service';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-products-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, QuillModule],
  templateUrl: './products-view.component.html',
  styleUrls: ['./products-view.component.scss']
})
export class ProductsViewComponent implements OnInit {
  products: Product[] = [];
  mode: 'list' | 'form' = 'list';
  editingId: number | null = null;
  searchTerm = '';
  categoryFilter = 'All';
  statusFilter: 'All' | 'Active' | 'Inactive' = 'All';
  productForm: FormGroup;
  isDragging = false;

  constructor(private fb: FormBuilder, private productService: ProductsService) {
    this.productForm = this.buildForm();
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      images: [[]],
      name: ['', [Validators.required, Validators.maxLength(120)]],
      category: ['', [Validators.required, Validators.maxLength(60)]],
      description: [''],
      status: [true],
      variants: this.fb.array<FormGroup>([])
    });
  }

  get variantsFA(): FormArray<FormGroup> {
    return this.productForm.get('variants') as FormArray<FormGroup>;
  }

  private createVariantRow(v?: Variant): FormGroup {
    return this.fb.group({
      size: [v?.size || '', Validators.required],
      color: [v?.color || '', Validators.required],
      price: [v?.price ?? null, [Validators.required, Validators.min(0)]],
      stock: [v?.stock ?? null, [Validators.required, Validators.min(0)]]
    });
  }

  get categories(): string[] {
    const set = new Set(this.products.map(p => p.category));
    return ['All', ...Array.from(set)];
  }

  get filteredProducts(): Product[] {
    return this.products
      .filter(p => !this.searchTerm || p.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
      .filter(p => this.categoryFilter === 'All' || p.category === this.categoryFilter)
      .filter(p => this.statusFilter === 'All' || p.status === this.statusFilter)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.fetchProducts().subscribe({
      next: (res: { products: Product[] }) => {
        this.products = res.products.map((p: any) => ({
          ...p,
          images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
          lastUpdated: new Date(p.lastUpdated)
        }));
      },
      error: (err) => console.error('Error fetching products', err)
    });
  }

  onAddProduct(): void {
    this.mode = 'form';
    this.editingId = null;
    this.productForm.reset({ images: [], name: '', category: '', description: '', status: true });
    this.variantsFA.clear();
    this.variantsFA.push(this.createVariantRow());
  }

  onEditProduct(p: Product): void {
    this.mode = 'form';
    this.editingId = p.product_id ?? null;
    this.productForm.reset({
      images: p.images,
      name: p.name,
      category: p.category,
      description: p.description,
      status: p.status === 'Active'
    });
    this.variantsFA.clear();
    p.variants.forEach(v => this.variantsFA.push(this.createVariantRow(v)));
  }

  onDeleteProduct(product_id?: number): void {
    if (!product_id) return;
    this.productService.deleteProduct(product_id).subscribe({
      next: () => this.loadProducts(),
      error: (err) => console.error('Error deleting product', err)
    });
  }

  onAddVariant(): void {
    this.variantsFA.push(this.createVariantRow());
  }

  onRemoveVariant(index: number): void {
    this.variantsFA.removeAt(index);
  }

  onCancel(): void {
    this.mode = 'list';
  }

  onSave(): void {
    if (this.productForm.invalid || this.variantsFA.length === 0) {
      this.productForm.markAllAsTouched();
      return;
    }

    const formVal = this.productForm.value as any;
    const product: Product = {
      name: formVal.name,
      category: formVal.category,
      images: formVal.images || [],
      description: formVal.description || '',
      status: formVal.status ? 'Active' : 'Inactive',
      lastUpdated: new Date(),
      variants: formVal.variants
    };

    if (this.editingId !== null) {
      (product as any).product_id = this.editingId;
      this.productService.updateProduct(this.editingId, product).subscribe(() => this.loadProducts());
    } else {
      this.productService.addProduct(product).subscribe(() => this.loadProducts());
    }

    this.mode = 'list';
    this.editingId = null;
  }

  private nextId(): number {
    return this.products.length ? Math.max(...this.products.map(p => (p.product_id ?? 0))) + 1 : 1;
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;
    this.addFiles(input.files);
  }

  triggerFileSelect(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(ev: DragEvent): void {
    ev.preventDefault();
    this.isDragging = false;
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.isDragging = false;
    if (ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length) {
      this.addFiles(ev.dataTransfer.files);
    }
  }

  removeImage(index: number): void {
    const current = (this.productForm.get('images')?.value as string[]) || [];
    const next = current.filter((_, i) => i !== index);
    this.productForm.patchValue({ images: next });
  }

  private addFiles(fileList: FileList | File[]): void {
    const files = Array.from(fileList as any as File[]);
    const readers = files.map(file => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    }));
    Promise.all(readers).then((base64Images) => {
      const existing = (this.productForm.get('images')?.value as string[]) || [];
      const merged = [...existing, ...base64Images];
      this.productForm.patchValue({ images: merged });
    });
  }

  onSelectionChanged(_evt: any): void { /* optional hook for selection changes */ }
  onContentChanged(_evt: any): void { /* optional hook for content changes */ }
}

// Types
export interface Variant {
  size: string;
  color: string;
  price: number;
  stock: number;
}

export interface Product {
  product_id?: number;
  name: string;
  category: string;
  images: string[];
  description: string;
  status: 'Active' | 'Inactive';
  lastUpdated: Date;
  variants: Variant[];
}
