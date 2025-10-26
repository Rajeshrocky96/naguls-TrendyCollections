import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatsappOrderFormComponent } from './whatsapp-order-form.component';

describe('WhatsappOrderFormComponent', () => {
  let component: WhatsappOrderFormComponent;
  let fixture: ComponentFixture<WhatsappOrderFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsappOrderFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhatsappOrderFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
