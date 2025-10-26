import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingUpdateComponent } from './tracking-update.component';

describe('TrackingUpdateComponent', () => {
  let component: TrackingUpdateComponent;
  let fixture: ComponentFixture<TrackingUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackingUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackingUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
