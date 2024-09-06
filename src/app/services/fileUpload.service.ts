import { Injectable } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

@Injectable({
  providedIn: 'root'
})

export class FileUploadService {
  private dbPromise: Promise<IDBPDatabase<FileDB>>;
  apiBaseUrl: any;

  constructor(private httpClient: HttpClient) {
    this.apiBaseUrl = 'http://localhost:3000';
    this.dbPromise = this.createDatabase();
  }

  async uploadFile(base64: any): Promise<any>{
    return this.httpClient.post(
      `${this.apiBaseUrl}${'/uploadFiles'}`,
      {
        file: base64,
      }
    );
  }

  private async createDatabase(): Promise<IDBPDatabase<FileDB>> {
    return openDB<FileDB>('uploaded-files-db', 1, {
      upgrade(db) {
        db.createObjectStore('files', { keyPath: 'name' });
      }
    });
  }

  async addFile(file: File): Promise<void> {
    const db = await this.dbPromise;
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

