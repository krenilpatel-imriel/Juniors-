import { Injectable } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FileRequestModel } from '../Models/fileRequestModel';
import { FileResponse } from '../Models/fileResponseModel';

@Injectable({
  providedIn: 'root'
})

export class FileUploadService {
  private dbPromise: Promise<IDBPDatabase<FileDB>>;
  apiBaseUrl: any;

  constructor(private httpClient: HttpClient) {
    this.apiBaseUrl = 'https://localhost:7035/api/Data';
    this.dbPromise = this.createDatabase();
  }

  uploadFile(data: FileRequestModel): any{
    console.log(data);
    return this.httpClient.post<FileRequestModel>(
      `${this.apiBaseUrl}${'/GetPdfValuesbyPdf'}`,
        data
    );
  }

  addFileContentsToDB(file: FileResponse): any {
    return this.httpClient.post<FileResponse>(
      `${this.apiBaseUrl}`,
        file
    );
  }

  getDataFromDB(): any {
    return this.httpClient.get<any>(
      `${this.apiBaseUrl}`
    );
  }

  private async createDatabase(): Promise<IDBPDatabase<FileDB>> {
    return openDB<FileDB>('uploaded-files-db', 1, {
      upgrade(db) {
        db.createObjectStore('files', { keyPath: 'name' });
      }
    });
  }

  async addFile(file: File): Promise<any> {
    const db = await this.dbPromise;
    var fileExists = db.get('files', file.name);
    console.log(fileExists);
    if (await fileExists) {
      alert('A file with this name already exists. Please select another file..!');
      return 0;
    }
      await db.put('files', file);
  }

  async getAllFiles(): Promise<File[]> {
    const db = await this.dbPromise;
    return db.getAll('files');
  }

  async removeFile(file: File): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('files', file.name);
  }

  async clearFiles(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear('files');
  }
}

interface FileDB extends DBSchema {
  'files': {
    key: string;
    value: File;
  };
}

