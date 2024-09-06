interface PdfValue {
  FieldName: string;
  FieldValue: string | null;
  Confidence: number;
}

interface TableCell {
  RowIndex: number;
  ColumnIndex: number;
  Content: string;
  Kind: string;
}

interface Table {
  TableNumber: number;
  Cells: TableCell[];
}

export interface FileResponse {
  PdfValues: PdfValue[];
  Tables: Table[];
  FileName: string | number;
}
