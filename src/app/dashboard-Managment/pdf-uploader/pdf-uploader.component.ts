import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-pdf-uploader',
  templateUrl: './pdf-uploader.component.html',
  styleUrls: ['./pdf-uploader.component.scss']
})
export class PDFUploaderComponent  {
  files: File[] = [];

  onFileSelected(event: any) {
    const selectedFiles = Array.from(event.target.files) as File[];
    this.files.push(...selectedFiles);
  }

  removeFile(file: File) {
    this.files = this.files.filter(f => f !== file);
  }

  getFileType(file: File): string {
    const fileType = file.type;
    if (fileType.includes('pdf')) {
      return 'PDF';
    } else if (fileType.includes('word')) {
      return 'Word Document';
    } else if (fileType.includes('excel') || fileType.includes('spreadsheetml')) {
      return 'Excel Document';
    } else {
      return 'Unknown';
    }
  }

}
