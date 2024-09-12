import { Component, OnInit, ViewChild } from '@angular/core';
import { FileResponse, PdfResponse } from 'src/app/Models/fileResponseModel';
import { FileUploadService } from 'src/app/services/fileUpload.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexMarkers,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexPlotOptions,
  ApexFill,
  ApexTooltip,
  ApexLegend,
  ApexResponsive,
  ApexGrid
} from 'ng-apexcharts';
import * as ExcelJS from 'exceljs';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';


@Component({
  selector: 'app-insights',
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss']
})
export class InsightsComponent {

  // KPI Data
  totalFilesProcessed = 0;
  successfulFiles = 0;
  failedFiles = 0;
  totalExpenses = 0;
  averageInvoiceAmount = 0;

  // Chart Data
  processingSuccessFail: any = [];
  processingTimeDistribution: any;
  monthlyExpensesChart: any = [];
  categoryWiseExpenses: any = [];
  topVendors: any = [];
  invoiceCountByDate: any = [];
  invoiceAmountDistribution: any = [];
  top10LargestInvoices: any = [];
  paidUnpaidInvoices: any = [];
  latePayments: any = [];
  vendorPaymentTrends: any = [];
  vendorReliability: any = [];
  expenseAnomalies: any;
  expenseForecasting: any;

  // Chart Data
  pdfResponse!: PdfResponse[];
  confidenceChart: any = [];
  invoiceDistributionChart: any = [];
  amountInWordsChart: any = [];
  extractedData: any[] = [];
  extractedDataforTable: any[] = []
  productsWithFileNames: { fileName: any, productName: any }[] = [];
  totalGrandTotal: number = 0;
  monthlyExpenses = new Array(12).fill(0);
  invoiceCountsByDate: { [key: string]: number } = {};
  invoiceCategories: string[] = [];
  totalTaxAmountShown : number = 0;
  totalNetAmountShown : number = 0;
  displayedColumns: string[] = ['fileNo', 'fileName', 'orderNo', 'product', 'soldByName', 'orderDate', 'grandTotal'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private fileService: FileUploadService) {

    this.fileService.getDataFromDB().subscribe((data: any) => {
      if (data) {
        this.initializeCharts(data);
        console.log(data);
      }
    });

  }



  initializeCharts(data: any) {
    console.log("data:", data);

    // Parse and process data
    this.pdfResponse = data.records.map((record: any) => {
      if (typeof record.jsoNcontent === 'string') {
        try {
          record.jsoNcontent = JSON.parse(record.jsoNcontent);
        } catch (error) {
          console.error('Error parsing JSON content:', error);
        }
      }
      return record;
    });

    this.extractValues();
    this.sortExtractedDataByOrderDate();
    this.calculateTotalGrandTotal();

    // Initialize charts
    const totalFilesProcessed = this.pdfResponse.length;
    this.generateConfidenceChart(totalFilesProcessed, this.pdfResponse);
    this.initializeInvoiceDistributionChart();
    this.initializePaidUnpaidInvoicesChart();
    this.initializeProcessingSuccessFailChart();
    this.initializeMonthlyExpensesChart();
    this.initializeTopVendorsChart();
    this.initializeInvoiceCountByDateChart();
    this.initializeInvoiceAmountDistributionChart();
}

// Sorting extracted data by OrderDate
sortExtractedDataByOrderDate() {
    this.extractedData.sort((a, b) => {
        const dateA = this.parseDate(a.OrderDate);
        const dateB = this.parseDate(b.OrderDate);
        return dateB.getFullYear() !== dateA.getFullYear()
            ? dateB.getFullYear() - dateA.getFullYear()
            : dateB.getMonth() - dateA.getMonth();
    });
}

// Initialize the Invoice Distribution Chart
initializeInvoiceDistributionChart() {
    let totalGrandTotal = 0;
    let totalTaxAmount = 0;

    this.pdfResponse.forEach(j => {
        j.jsoNcontent.PdfValues.forEach(i => {
            if (i.FieldName === 'GrandTotal' && i.FieldValue) {
                const grandTotalValue = i.FieldValue.replace(/₹|,/g, '') || '0';
                totalGrandTotal += parseFloat(grandTotalValue);
            }
            if (i.FieldName === 'TotalTaxAmount' && i.FieldValue) {
                const taxAmountValue = i.FieldValue.replace(/₹|,/g, '') || '0';
                totalTaxAmount += parseFloat(taxAmountValue);
            }
        });
    });

    const taxPercentageOfGrandTotal = (totalTaxAmount / totalGrandTotal) * 100;
    const formattedTaxAmount = parseFloat(totalTaxAmount.toFixed(2));
    const formattedGrandTotal = parseFloat((totalGrandTotal - formattedTaxAmount).toFixed(2));
    this.totalTaxAmountShown = formattedTaxAmount;
    this.totalNetAmountShown = formattedGrandTotal;
    this.invoiceDistributionChart = {
        series: [formattedGrandTotal, formattedTaxAmount],
        chart: { type: 'pie', height: 350 },
        labels: ['Net Total Amount', 'Total Tax Amount'],
        title: { text: `Total Tax Amount is ${taxPercentageOfGrandTotal.toFixed(2)}% of Grand Total` },
        responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }]
    };
}

// Initialize the Paid vs. Unpaid Invoices Chart
initializePaidUnpaidInvoicesChart() {
    this.paidUnpaidInvoices = {
        series: [60, 40],
        chart: { type: 'radialBar', height: 350 },
        labels: ['Paid', 'Unpaid'],
        title: { text: 'Paid vs. Unpaid Invoices' }
    };
}

// Initialize Processing Success/Fail Chart
initializeProcessingSuccessFailChart() {
    this.processingSuccessFail = {
        series: this.successfulFiles || this.failedFiles ? [this.successfulFiles, this.failedFiles] : [],
        chart: { type: 'donut' },
        labels: ['Successful', 'Failed'],
        responsive: [{ breakpoint: 400, options: { chart: { height: 180 }, legend: { position: 'bottom' } } }]
    };
}

// Initialize Monthly Expenses Chart
initializeMonthlyExpensesChart() {
  const quarterlyExpenses: { [key: string]: number } = {};

  // Accumulate expenses by quarter
  this.extractedData.forEach(item => {
      const orderDate = this.parseDate(item.OrderDate);
      const grandTotal = parseFloat(item.GrandTotal);
      const quarter = this.getQuarterforCharts(orderDate);
      const year = orderDate.getFullYear().toString().slice(-2);  // Last two digits of the year
      const quarterLabel = `${quarter} ${year}`;  // Label format: "Q1 22", "Q2 23", etc.
      quarterlyExpenses[quarterLabel] = (quarterlyExpenses[quarterLabel] || 0) + grandTotal;
  });

  // Sort the quarters by year and quarter (calendar order: Q1 -> Q4)
  const sortedQuarterLabels = Object.keys(quarterlyExpenses).sort((a, b) => {
      const [quarterA, yearA] = a.split(' ');
      const [quarterB, yearB] = b.split(' ');

      // Compare years first
      const yearComparison = parseInt(yearA) - parseInt(yearB);
      if (yearComparison !== 0) {
          return yearComparison;  // Sort by year
      }

      // Sort quarters by calendar order (Q1 = Jan-Mar, Q2 = Apr-Jun, Q3 = Jul-Sep, Q4 = Oct-Dec)
      const quarterOrder: { [key: string]: number } = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
      const quarterComparison = quarterOrder[quarterA] - quarterOrder[quarterB];

      return quarterComparison;
  });

  // Prepare the chart data
  const quarterLabels = sortedQuarterLabels.map(label => label);  // Labels like "Q1 22", "Q2 23", etc.
  const expenseValues = sortedQuarterLabels.map(label => parseFloat(quarterlyExpenses[label].toFixed(2)));

  // Initialize the chart
  this.monthlyExpensesChart = {
      series: [{ name: 'Expenses', data: expenseValues }],
      chart: { type: 'line', height: 350 },
      xaxis: { categories: quarterLabels, title: { text: 'Quarter-Year' } },
      yaxis: { title: { text: 'Total Expenses' }, labels: { formatter: (value: number) => value.toFixed(2) } },
      tooltip: { y: { formatter: (value: number) => value.toFixed(2) } }
  };
}



// Initialize Top Vendors Chart
initializeTopVendorsChart() {
  const vendorTotals: { [key: string]: number } = {};

  // Accumulate totals for each vendor
  this.extractedData.forEach(item => {
      const soldByName = item.SoldByName;
      const grandTotal = parseFloat(item.GrandTotal) || 0;
      vendorTotals[soldByName] = (vendorTotals[soldByName] || 0) + grandTotal;
  });

  // Sort vendors by total amount in descending order and get the top 10
  const sortedVendors = Object.entries(vendorTotals)
      .sort(([, totalA], [, totalB]) => totalB - totalA)
      .slice(0, 10);

  // Prepare series data for the chart
  const seriesData = sortedVendors.map(([vendor, total]) => ({
      name: vendor,
      data: [parseFloat(total.toFixed(2))]
  }));

  // Extract labels and values separately for the pie chart
  const vendorLabels = sortedVendors.map(([vendor]) => vendor);
  const vendorData = sortedVendors.map(([, total]) => parseFloat(total.toFixed(2)));

  // Initialize the chart
  this.topVendors = {
      series: vendorData,
      chart: { type: 'pie', height: 450 },
      labels: vendorLabels,
      tooltip: {
          y: {
              formatter: (value: number) => `₹${value.toFixed(2)}` // Format tooltip with rupee symbol
          }
      },
      responsive: [
          { breakpoint: 480, options: { chart: { width: 300 }, legend: { position: 'bottom' } } }
      ]
  };
}


// Initialize Invoice Count by Date Chart
initializeInvoiceCountByDateChart() {
  const invoiceCountsByQuarter: { [key: string]: number } = {};

  // Count invoices by quarter
  this.extractedData.forEach(item => {
    const orderDate = this.parseDate(item.OrderDate);
    const quarterLabel = this.getQuarterLabel(orderDate); // Example format: 'Jan-Mar:2023'
    invoiceCountsByQuarter[quarterLabel] = (invoiceCountsByQuarter[quarterLabel] || 0) + 1;
  });

  // Sort the quarter labels by year and quarter range
  const sortedQuarterLabels = Object.keys(invoiceCountsByQuarter).sort((a, b) => {
    const [rangeA, yearA] = a.split(':'); // e.g., ['Jan-Mar', '2023']
    const [rangeB, yearB] = b.split(':');

    // Sort by year first
    const yearComparison = parseInt(yearA) - parseInt(yearB);
    if (yearComparison !== 0) {
      return yearComparison;
    }

    // Sort by quarter range if the year is the same
    const quarterOrder: { [key: string]: number } = { 'Jan-Mar': 1, 'Apr-Jun': 2, 'Jul-Sep': 3, 'Oct-Dec': 4 };
    return quarterOrder[rangeA] - quarterOrder[rangeB];
  });

  // Map the sorted quarter labels to chart data
  const categories = sortedQuarterLabels.map(label => label);
  const data = sortedQuarterLabels.map(label => invoiceCountsByQuarter[label]);

  // Set up the chart configuration
  this.invoiceCountByDate = {
    series: [{ name: 'Invoices', data }],
    chart: { type: 'bar', height: 350 },
    xaxis: { categories, title: { text: 'Quarter-Year' } },
    yaxis: { title: { text: 'Total Invoices' } }
  };
}

getQuarterLabel(date: Date): string {
  const month = date.getMonth() + 1; // Months are 0-indexed
  const year = date.getFullYear();
  let range = '';

  if (month <= 3) {
    range = 'Jan-Mar';
  } else if (month <= 6) {
    range = 'Apr-Jun';
  } else if (month <= 9) {
    range = 'Jul-Sep';
  } else {
    range = 'Oct-Dec';
  }

  return `${range}:${year}`; // Return format: "Jan-Mar:2023"
}



// Initialize Invoice Amount Distribution Chart
initializeInvoiceAmountDistributionChart() {
    const priceRanges = [
        { range: '0 - 1000', min: 0, max: 1000, count: 0 },
        { range: '1000 - 5000', min: 1000, max: 5000, count: 0 },
        { range: '5000 - 10000', min: 5000, max: 10000, count: 0 },
        { range: '10000 - 20000', min: 10000, max: 20000, count: 0 },
        { range: '20000+', min: 20000, max: Infinity, count: 0 }
    ];

    this.extractedData.forEach(item => {
        const grandTotal = item.GrandTotal;
        for (const range of priceRanges) {
            if (grandTotal >= range.min && grandTotal < range.max) {
                range.count++;
                break;
            }
        }
    });

    const categoriesPrice = priceRanges.map(range => range.range);
    const dataPrice = priceRanges.map(range => range.count);

    this.invoiceAmountDistribution = {
        series: [{ name: 'Invoices', data: dataPrice }],
        chart: { type: 'heatmap', height: 350 },
        xaxis: { categories: categoriesPrice, title: { text: 'Price in ₹' } }
    };
}



  fetchTableData() {
    // Prepare the data with additional formatting for dates and amounts
    const data = this.extractedDataforTable.map((row, idx) => {
      let formattedGrandTotal = 0;

      if (row.GrandTotal) {
        // Check if GrandTotal is a string, if so, remove currency symbols and commas
        if (typeof row.GrandTotal === 'string') {
          formattedGrandTotal = Number(row.GrandTotal.replace(/[^0-9.-]+/g, '')) || 0;
        } else {
          // If it's already a number, just use it
          formattedGrandTotal = row.GrandTotal;
        }
      }

      // Format the date (assumes DD.MM.YYYY format in OrderDate)
      let formattedOrderDate = row.OrderDate;
      if (row.OrderDate) {
        const dateParts = row.OrderDate.split('.');
        if (dateParts.length === 3) {
          // Convert to YYYY-MM-DD for better date handling
          formattedOrderDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        }
      }

      return {
        ...row,
        fileName: this.productsWithFileNames[idx]?.fileName || 'Unknown',
        productName: this.productsWithFileNames[idx]?.productName || 'Unknown',
        GrandTotal: formattedGrandTotal,
        OrderDate: formattedOrderDate
      };
    });

    // Sort data by date in descending order
    data.sort((a, b) => {
      const dateA = new Date(a.OrderDate);
      const dateB = new Date(b.OrderDate);
      return dateB.getTime() - dateA.getTime(); // Latest date first
    });

    // Update the data source and paginator after data is processed
    this.dataSource.data = data;
    this.sortTableValues();
    // Calculate total GrandTotal from formatted values
    this.totalGrandTotal = data.reduce((acc, row) => acc + (row.GrandTotal || 0), 0);

    console.log(this.productsWithFileNames);
    console.log(this.dataSource.data);
  }




  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }


  sortTableValues() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property.toLowerCase()) {
        case 'grandtotal':
          return item.GrandTotal || 0; // Numeric sorting
        case 'orderdate':
          const dateParts = item.OrderDate?.split('-'); // Assuming 'YYYY-MM-DD' format
          return dateParts ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) : new Date(0);
        default:
          return item[property];
      }
    };
  }



  extractValues() {
    this.extractedData = [];

    this.pdfResponse.forEach((record: any) => {
      const fileName = record.jsoNfilename || 'Unknown';

      record.jsoNcontent.Tables[0].Cells.forEach((cell: any) => {
          if (cell.Kind === 'content' && cell.ColumnIndex === 1 && cell.RowIndex === 1) {
            const productName = cell.Content.split('|')[0];
            this.productsWithFileNames.push({ fileName, productName });
          }
        });
      });
    console.log("products with files", this.productsWithFileNames);


    this.pdfResponse.forEach((record: PdfResponse) => {
      const extractedRow: any = {};
      extractedRow.id = record.id;
      record.jsoNcontent.PdfValues.forEach((pdfValue: any) => {
        const field = pdfValue.FieldName;
        const value = pdfValue.FieldValue;

        if (value !== null) {
          switch (field) {

            case 'GrandTotal':

              const parsedValue = parseFloat(value.replace(/₹|,/g, ''));
              extractedRow.GrandTotal = parseFloat(parsedValue.toFixed(2));
              // Removing currency symbols
              break;
            case 'OrderDate':
              extractedRow.OrderDate = value.replace('Date:', '');
              break;
            case 'BillToName':
              extractedRow.BillToName = value;
              break;
            case 'SoldByName':
              extractedRow.SoldByName = value;
              break;
            case 'OrderNo':
              extractedRow.OrderNo = value;
              break;
          }
        }
      });

      // Push the extracted row to the array
      this.extractedData.push(extractedRow);
      this.extractedDataforTable= this.extractedData;
      this.totalFilesProcessed = this.extractedData.length;
      this.totalFilesProcessed = this.totalFilesProcessed;
      this.successfulFiles = this.totalFilesProcessed;;
      this.failedFiles = 0;
    });
    this.fetchTableData();
  }

  calculateTotalGrandTotal() {
    this.totalGrandTotal = this.extractedData.reduce((total, row) => {
      return total + (row.GrandTotal || 0);
    }, 0);

    this.totalExpenses = parseFloat(this.totalGrandTotal.toFixed(2));

    this.averageInvoiceAmount = parseFloat((this.totalGrandTotal / this.totalFilesProcessed).toFixed(2));


  }

  formatDateForChart(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear().toString().slice(-2); // Get the last two digits of the year
    return `${day}-${month}-${year}`; // Format as DD-MM-YY
  }






  parseDate(orderDate: string): Date {
    // Assuming the format is "Date:DD.MM.YYYY"
    const dateParts = orderDate.replace('Date:', '').split('.');
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Months are 0-indexed in JavaScript Date
    const year = parseInt(dateParts[2], 10);

    return new Date(year, month, day);
  }

  async exportToExcel(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Recent Transactions');

 // Add super header row
const superHeader = worksheet.addRow(['VIEWVOICE']);

// Set font, alignment, and fill properties for the super header cell
const superHeaderCell = superHeader.getCell(1);
superHeaderCell.font = { bold: true, color: { argb: 'FFFFFF' } };
superHeaderCell.fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: '3B82F6' } // Light blue background
};

// Adjust row height for super header
superHeader.height = 40;

// Merge cells for the super header
worksheet.mergeCells('A1:G1');

// Center the content of the merged cells
const mergedCells = worksheet.getCell('A1');
mergedCells.alignment = { horizontal: 'center', vertical: 'middle' };


    // Define the header
    const header = ['File No.', 'FileName', 'Order Id', 'Product', 'Vendor', 'Date', 'Amount'];

    // Add header row
    const headerRow = worksheet.addRow(header);

    // Apply header styling (light gray background and text color)
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { bold: true, color: { argb: '4B4B4B' } }; // Gray text color
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D3D3D3' } // Light gray background
      };
      cell.border = {
        bottom: { style: 'thin' }
      };
    });

    // Prepare the data rows
    this.extractedData.forEach((row, idx) => {
      const dataRow = worksheet.addRow([
        `F${row.id}`, // File No.
        this.productsWithFileNames[idx]?.fileName || 'Unknown', // FileName
        row.OrderNo || 'N/A', // Order Id
        this.productsWithFileNames[idx]?.productName || 'N/A', // Product
        row.SoldByName || 'N/A', // Vendor
        row.OrderDate || 'N/A', // Date
        `₹${row.GrandTotal || 'N/A'}` // Amount
      ]);

      // Make amount values bold and green
      dataRow.getCell(7).font = { bold: true, color: { argb: '008000' } }; // Green color for Amount
    });

    // Add the total row
    const totalRow = worksheet.addRow([
      '', // Empty cell for File No.
      '', // Empty cell for FileName
      '', // Empty cell for Order Id
      '', // Empty cell for Product
      '', // Empty cell for Vendor
      '', // Empty cell for Date
      `Grand Total: ₹${this.totalGrandTotal.toFixed(2)}` // Amount
    ]);

    // Make grand total bold
    totalRow.getCell(7).font = { bold: true };

    // Apply styling to all rows (make the rest of the rows white)
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      row.height = 35; // Increase row height
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { horizontal: 'left', vertical: 'middle' }; // Center and middle alignment
        if (rowNumber > 1 && rowNumber !== worksheet.rowCount) { // Skip the super header and the grand total row
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF' } // White background for data rows
          };
        }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Set column widths
    worksheet.getColumn(1).width = 15; // File No.
    worksheet.getColumn(2).width = 30; // FileName
    worksheet.getColumn(3).width = 20; // Order Id
    worksheet.getColumn(4).width = 60; // Product
    worksheet.getColumn(5).width = 30; // Vendor
    worksheet.getColumn(6).width = 20; // Date
    worksheet.getColumn(7).width = 25; // Amount

    // Export the workbook
    await workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Recent_Transactions.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }


  generateConfidenceChart(totalFilesProcessed: number, pdfResponse: any[]) {
    // Step 1: Sort extracted data by `id` in ascending order before generating confidence labels
    const sortedExtractedData = this.extractedData.sort((a: any, b: any) => a.id - b.id);
    const confidenceLabels = sortedExtractedData.map((data: any) => `F${data.id}`); // Generate labels like F1, F2, F3, etc.

    // Step 2: Calculate the average confidence for each file in pdfResponse
    const confidenceData = pdfResponse.map(j => {
      const confidences = j.jsoNcontent.PdfValues.map((i: { Confidence: number }) => i.Confidence);

      // Calculate the average confidence for this file
      const totalConfidence = confidences.reduce((sum: any, value: any) => sum + value, 0);
      const averageConfidence = totalConfidence / confidences.length;

      return parseFloat(averageConfidence.toFixed(2));  // Format to 2 decimal places
    });

    // Step 3: Configure the confidence chart
    this.confidenceChart = {
      series: [{
        name: 'Average Confidence Level',
        data: confidenceData ? confidenceData : []  // Average confidence data for each file
      }],
      chart: {
        type: 'bar',
        height: 350
      },
      xaxis: {
        categories: confidenceLabels,  // Sorted labels as categories on the x-axis
        title: {
          text: 'File Names'
        }
      },
      yaxis: {
        title: {
          text: 'Average Confidence Level'
        },
        min: 0,
        max: 100 // Assuming confidence level is a percentage between 0 and 100
      },
      title: {
        text: 'Average Confidence Levels by File'
      },
      tooltip: {
        y: {
          formatter: function (val: string) {
            return `${parseFloat(val).toFixed(2)}%`;  // Format the tooltip value to 2 decimal places
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: string) {
          return `${parseFloat(val).toFixed(2)}%`;  // Display the value on the bar as a percentage with 2 decimals
        }
      },
      colors: ['#00E396'],  // Optional: You can set the bar color
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '50%'
        }
      }
    };
}

exportDivsToPdf(): void {
  const invoiceDistributionDiv = document.querySelector('.invoice-amount-div') as HTMLElement;
  const expenseOverviewDiv = document.querySelector('.expense-overview-div') as HTMLElement;
  const invoiceDetailsDiv = document.querySelector('.invoice-details-div') as HTMLElement;

  const container = document.querySelector('.print-pdf') as HTMLElement;
  container.classList.remove("hidden"); // Make the container visible
  container.classList.add("bg-white"); // Ensure container background is white

  // Function to style the div and add it to the PDF as an image
  const addDivToPdf = (div: HTMLElement, pageNum: number, callback: () => void) => {
      // Clear the container
      container.innerHTML = '';
      const clonedDiv = div.cloneNode(true) as HTMLElement;

      // Ensure the div and its children have white backgrounds
      clonedDiv.style.backgroundColor = 'white';
      clonedDiv.style.padding = '10px'; // Optional: Add padding for better appearance

      // Ensure all child canvas elements have a white background
      const canvasElements = clonedDiv.querySelectorAll('canvas');
      canvasElements.forEach(canvas => {
          (canvas as HTMLCanvasElement).style.backgroundColor = 'white';
      });

      container.appendChild(clonedDiv);

      // Use html2canvas to capture the div
      html2canvas(container, {
          backgroundColor: null, // Ensure no additional background is applied
          scale: 3 // Optional: Increase scale for better resolution
      }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 280; // Full width of A4 in mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width; // Calculate image height to maintain aspect ratio

          if (pageNum > 1) pdf.addPage(); // Add a new page for each div after the first one
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight); // Add the image to the PDF

          callback(); // Proceed to the next step after rendering
      });
  };

  // Create a new PDF document
  const pdf = new jsPDF('l', 'mm', [210, 297]); // A4 size

  // Add divs to the PDF in sequence
  addDivToPdf(expenseOverviewDiv, 1, () => {
      addDivToPdf(invoiceDistributionDiv, 2, () => {
          addDivToPdf(invoiceDetailsDiv, 3, () => {
              // Save the PDF after all divs are added
              pdf.save('viewvoice-report.pdf');

              // Hide the container again and clean up
              container.classList.add("hidden");
              container.innerHTML = '';
          });
      });
  });
}





parseDateforChart(dateString: string): Date {
  const [day, month, year] = dateString.split('.').map(Number);
  return new Date(year, month - 1, day); // Months are 0-indexed
}

getQuarterforCharts(orderDate: Date): string {
    const month = orderDate.getMonth();  // getMonth() returns 0 for January, 11 for December

    if (month >= 0 && month <= 2) {
        return 'Q1';  // January (0) to March (2)
    } else if (month >= 3 && month <= 5) {
        return 'Q2';  // April (3) to June (5)
    } else if (month >= 6 && month <= 8) {
        return 'Q3';  // July (6) to September (8)
    } else {
        return 'Q4';  // October (9) to December (11)
    }
}

}
