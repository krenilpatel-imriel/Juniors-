import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FileRequestModel } from '../Models/fileRequestModel';
import { FileResponse } from '../Models/fileResponseModel';
import { BehaviorSubject, finalize } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private dbPromise: Promise<IDBPDatabase<FileDB>>;
  apiBaseUrl: string;

  // BehaviorSubject to handle loading state
  private _loading = new BehaviorSubject<boolean>(false);
  public loading$ = this._loading.asObservable();

  constructor(private httpClient: HttpClient) {
    this.apiBaseUrl = 'https://localhost:7035/api/Data';
    this.dbPromise = this.createDatabase();
  }

  // Set loading state
  setLoadingState(isLoading: boolean) {
    this._loading.next(isLoading); // Emit new loading state
  }

  // Upload file with loading state management
  uploadFile(data: FileRequestModel): any {
    this.setLoadingState(true);
    return this.httpClient.post<FileRequestModel>(`${this.apiBaseUrl}/GetPdfValuesbyPdf`, data)
      .pipe(
        finalize(() => this.setLoadingState(false)) // Set loading state to false when done
      );
  }

  // Add file contents to database with loading state management
  addFileContentsToDB(file: FileResponse): any {
    this.setLoadingState(true);
    return this.httpClient.post<FileResponse>(this.apiBaseUrl, file)
      .pipe(
        finalize(() => this.setLoadingState(false))
      );
  }

  // Fetch data from DB with loading state management
  getDataFromDB() {
    this.setLoadingState(true);
    return this.httpClient.get<any>(`${this.apiBaseUrl}`).pipe(
      finalize(() => this.setLoadingState(false)) // Stop loading when the data fetch completes
    );
  }

  // IDB Database creation logic
  private async createDatabase(): Promise<IDBPDatabase<FileDB>> {
    return openDB<FileDB>('uploaded-files-db', 1, {
      upgrade(db) {
        db.createObjectStore('files', { keyPath: 'name' });
      }
    });
  }

  // Add a file to the local IndexedDB
  async addFile(file: File): Promise<any> {
    const db = await this.dbPromise;
    const fileExists = await db.get('files', file.name);
    if (fileExists) {
      alert('A file with this name already exists. Please select another file.');
      return 0;
    }
    await db.put('files', file);
  }

  // Get all files from IndexedDB
  async getAllFiles(): Promise<File[]> {
    const db = await this.dbPromise;
    return db.getAll('files');
  }

  // Remove a file from IndexedDB
  async removeFile(file: File): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('files', file.name);
  }

  // Clear all files from IndexedDB
  async clearFiles(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear('files');
  }
}

// Interface for the IndexedDB schema
interface FileDB extends DBSchema {
  'files': {
    key: string;
    value: File;
  };
}
