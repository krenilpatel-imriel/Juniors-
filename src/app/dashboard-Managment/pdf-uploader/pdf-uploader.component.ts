import { FileResponse } from 'src/app/Models/fileResponseModel';
import { Component, OnInit } from '@angular/core';
import { FileUploadService } from 'src/app/services/fileUpload.service';
import { FileRequestModel } from 'src/app/Models/fileRequestModel';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-pdf-uploader',
  templateUrl: './pdf-uploader.component.html',
  styleUrls: ['./pdf-uploader.component.scss']
})
export class PDFUploaderComponent implements OnInit {
  files: File[] = [];
  pdfResponse!: FileResponse;

  constructor(private fileService: FileUploadService) { }

  async ngOnInit(): Promise<void> {
    this.files = await this.fileService.getAllFiles();
}

  async onFileSelected(event: any) {
    const reader = new FileReader();
    const selectedFiles = Array.from(event.target.files) as File[];

    for (const file of selectedFiles) {
      var result = await this.fileService.addFile(file);
      if (result == 0) return;

      this.files.push(file);

      reader.onload = async (e: any) => {
        let base64String = e.target.result;
        const cleanBase64 = base64String.split(',')[1];
        const data: FileRequestModel = {
          FileName: file.name,
          Base64String: cleanBase64
        }

        // Calling backend api to upload files in Azure AI service
        this.fileService.uploadFile(data).subscribe((response: any) => {
          // console.log(response);
          this.pdfResponse = response;
          this.addFileToDb(this.pdfResponse);
        });
      }

      reader.readAsDataURL(file);
    }
  }

  addFileToDb(file: FileResponse) {
    this.fileService.addFileContentsToDB(file).subscribe((data: any) => {
      // console.log(data);
    });
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
