import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PDFUploaderComponent } from './pdf-uploader.component';

describe('PDFUploaderComponent', () => {
  let component: PDFUploaderComponent;
  let fixture: ComponentFixture<PDFUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PDFUploaderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PDFUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
