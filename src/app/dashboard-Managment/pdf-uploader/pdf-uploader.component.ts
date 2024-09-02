import { Component, OnInit } from '@angular/core';
import { FileUploadService } from 'src/app/services/fileUpload.service';

@Component({
  selector: 'app-pdf-uploader',
  templateUrl: './pdf-uploader.component.html',
  styleUrls: ['./pdf-uploader.component.scss']
})
export class PDFUploaderComponent implements OnInit  {
  files: File[] = [];

  constructor(private fileService: FileUploadService) { }

  async ngOnInit(): Promise<void> {
    this.files = await this.fileService.getAllFiles();
  }

  async onFileSelected(event: any) {
    const reader = new FileReader();
    const selectedFiles = Array.from(event.target.files) as File[];

    for (const file of selectedFiles) {
      await this.fileService.addFile(file);
      this.files.push(file);

      reader.onload = async (e: any) => {
        let base64String = e.target.result;
        console.log(base64String);

      // Calling backend api to upload files in Azure AI service
      // const response = await this.fileService.uploadFile(file.name, base64String);
      // console.log(response);
      }

      reader.readAsDataURL(file);
    }
  }

  async removeFile(file: File) {
    this.files = this.files.filter(f => f !== file);
    await this.fileService.removeFile(file);
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
