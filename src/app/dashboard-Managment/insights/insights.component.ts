import { Component, OnInit } from '@angular/core';
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
  productsWithFileNames: { fileName: any, productName: any }[] = [];  
  totalGrandTotal: number = 0;
  monthlyExpenses = new Array(12).fill(0);
  invoiceCountsByDate: { [key: string]: number } = {};
  invoiceCategories: string[] = [];
  totalTaxAmountShown : number = 0;
  

  constructor(private fileService: FileUploadService) {

    this.fileService.getDataFromDB().subscribe((data: any) => {
      if (data) {
        this.initializeCharts(data);
        console.log(data);
      }
    });

  }

  ngOnInit(): void {
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
      this.totalFilesProcessed = this.extractedData.length;

      this.totalFilesProcessed = this.totalFilesProcessed;
      this.successfulFiles = this.totalFilesProcessed;;
      this.failedFiles = 0;
    });
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
    return `${day}-${month}`;
  }




  parseDate(orderDate: string): Date {
    // Assuming the format is "Date:DD.MM.YYYY"
    const dateParts = orderDate.replace('Date:', '').split('.');
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Months are 0-indexed in JavaScript Date
    const year = parseInt(dateParts[2], 10);

    return new Date(year, month, day);
  }


  initializeCharts(data: any) {
    console.log("data:", data);
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

    // Sort data by OrderDate (latest first, considering year and month)
    this.extractedData.sort((a, b) => {
      // Convert OrderDate to Date object
      const dateA = this.parseDate(a.OrderDate);
      const dateB = this.parseDate(b.OrderDate);

      // Compare year first, then month
      if (dateB.getFullYear() !== dateA.getFullYear()) {
        return dateB.getFullYear() - dateA.getFullYear(); // Sort by year
      }
      return dateB.getMonth() - dateA.getMonth(); // Sort by month
    });
    this.calculateTotalGrandTotal();

    
    // Flatten the PdfValues arrays into a single array
    const totalFilesProcessed = this.pdfResponse.length; // Or any other way to calculate total files processed
    this.generateConfidenceChart(totalFilesProcessed, this.pdfResponse);

// Step 1: Extract and sum the GrandTotal and TotalTaxAmount values
let totalGrandTotal = 0;
let totalTaxAmount = 0;

this.pdfResponse.forEach(j => {
  j.jsoNcontent.PdfValues.forEach(i => {
    if (i.FieldName === 'GrandTotal' && i.FieldValue !== null) {
      const grandTotalValue = i.FieldValue ? i.FieldValue.replace(/₹|,/g, '') : '0';
      totalGrandTotal += parseFloat(grandTotalValue); // Safely parse the value
    }
    if (i.FieldName === 'TotalTaxAmount' && i.FieldValue !== null) {
      const taxAmountValue = i.FieldValue ? i.FieldValue.replace(/₹|,/g, '') : '0';
      totalTaxAmount += parseFloat(taxAmountValue); 
      this.totalTaxAmountShown = totalTaxAmount// Safely parse the value
    }
  });
});

// Step 2: Calculate the percentage of TotalTaxAmount out of GrandTotal
const taxPercentageOfGrandTotal = (totalTaxAmount / totalGrandTotal) * 100;

// Step 3: Format values to two decimal places
const formattedTaxAmount = parseFloat(totalTaxAmount.toFixed(2));
let formattedGrandTotal = totalGrandTotal - formattedTaxAmount;
formattedGrandTotal = parseFloat(formattedGrandTotal.toFixed(2));

// Step 4: Create the chart and display the relevant information
this.invoiceDistributionChart = {
  series: [formattedGrandTotal, formattedTaxAmount], // Series with the sum of GrandTotal and TotalTaxAmount
  chart: {
    type: 'pie',
    height: 350
  },
  labels: ['Net Total', 'Total Tax Amount'], // Labels for the chart
  title: {
    text: `Invoice Amount Distribution: Total Tax Amount is ${taxPercentageOfGrandTotal.toFixed(2)}% of Grand Total`
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }
  ]
};


    this.paidUnpaidInvoices = {
      series: [60, 40],
      chart: {
        type: 'radialBar',
        height: 350
      },
      labels: ['Paid', 'Unpaid'],
      title: {
        text: 'Paid vs. Unpaid Invoices'
      }
    };



    this.processingSuccessFail = {
      series: this.successfulFiles || this.failedFiles ? [this.successfulFiles, this.failedFiles]: [],
      chart: {
        type: 'donut'
      },
      labels: ['Successful', 'Failed'],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ]
    };

    this.processingTimeDistribution = {
      series: [{
        name: 'Processing Time',
        data: [20, 25, 30, 35, 28, 45, 60] // Example processing times in seconds
      }],
      chart: {
        type: 'line',
        height: 350
      },
      xaxis: {
        categories: ['File1', 'File2', 'File3', 'File4', 'File5', 'File6', 'File7']
      },
      title: {
        text: 'Processing Time Distribution'
      }
    };

    this.extractedData.forEach((item) => {
      const orderDate = this.parseDate(item.OrderDate);
      const grandTotal = parseFloat(item.GrandTotal);

      // Get the month index (0 for January, 11 for December)
      const monthIndex = orderDate.getMonth();

      // Accumulate the grand total for the corresponding month
      this.monthlyExpenses[monthIndex] += grandTotal;
    });

    const formattedMonthlyExpenses = this.monthlyExpenses.map(expense => parseFloat(expense.toFixed(2)));


    // Now that we have the monthly expenses, update the chart data
    this.monthlyExpensesChart = {
      series: [{
        name: 'Expenses',
        data: formattedMonthlyExpenses ? formattedMonthlyExpenses : []// Use the calculated monthly expenses
      }],
      chart: {
        type: 'line',
        height: 350
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      }
    };


    const vendorTotals: { [key: string]: number } = {};

    // Iterate through the extracted data
    this.extractedData.forEach((item) => {
      const SoldByName = item.SoldByName;
      const grandTotal = parseFloat(item.GrandTotal) || 0;

      // Accumulate the grand total for each BillToName
      if (vendorTotals[SoldByName]) {
        vendorTotals[SoldByName] += grandTotal;
      } else {
        vendorTotals[SoldByName] = grandTotal;
      }
    });

    const vendorLabels = Object.keys(vendorTotals); // BillToName values
    const vendorData = Object.values(vendorTotals).map(total => parseFloat(total.toFixed(2))); // Corresponding GrandTotal values

    // Now that we have the totals, update the pie chart data
    this.topVendors = {
      series: vendorData, // Use the accumulated GrandTotal values
      chart: {
        type: 'pie',
        height: 450
      },
      labels: vendorLabels, // Use the BillToName values as labels
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 300,
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ]
    };

    this.extractedData.forEach((item) => {
      const orderDate = this.parseDate(item.OrderDate);
      const formattedDate = this.formatDateForChart(orderDate);

      // Increment the count for the formatted date
      if (this.invoiceCountsByDate[formattedDate]) {
        this.invoiceCountsByDate[formattedDate]++;
      } else {
        this.invoiceCountsByDate[formattedDate] = 1;
      }
    });

    this.calculateTotalGrandTotal();
    // Generate categories and data arrays for the chart
    const categories: string[] = [];
    const datedata: number[] = [];

    // Fill categories and data arrays
    Object.keys(this.invoiceCountsByDate).sort().forEach(date => {
      categories.push(date);
      datedata.push(this.invoiceCountsByDate[date]);
    });

    // Update the chart configuration
    this.invoiceCountByDate = {
      series: [{
        name: 'Invoices',
        data: datedata ? datedata : [] // Use the calculated invoice counts
      }],
      chart: {
        type: 'heatmap',
        height: 350
      },
      xaxis: {
        categories: categories, // Use the formatted dates as categories
        title: {
          text: 'Date (DD/MM)' 
        }
      }
    };

    const priceRanges = [
      { range: '0 - 1000', min: 0, max: 1000, count: 0 },
      { range: '1000 - 5000', min: 1000, max: 5000, count: 0 },
      { range: '5000 - 10000', min: 5000, max: 10000, count: 0 },
      { range: '10000 - 20000', min: 10000, max: 20000, count: 0 },
      { range: '20000+', min: 20000, max: Infinity, count: 0 }
    ];
    this.extractedData.forEach((item) => {
      const grandTotal = item.GrandTotal;

      // Find the appropriate range and increment its count
      for (const range of priceRanges) {
        if (grandTotal >= range.min && grandTotal < range.max) {
          range.count++;
          break;
        }
      }
    });

    const categoriesPrice: string[] = priceRanges.map(range => range.range);
    const dataPrice: number[] = priceRanges.map(range => range.count);

    this.invoiceAmountDistribution = {
      series: [{
        name: 'Invoices',
        data: dataPrice ? dataPrice : []// Example invoice counts
      }],
      chart: {
        type: 'heatmap',
        height: 350
      },
      xaxis: {
        categories: categoriesPrice,
        title: {
          text: 'Price in ₹' 
        }
      }
    };

    this.paidUnpaidInvoices = {
      series: [60, 40],
      chart: {
        type: 'radialBar',
        height: 350
      },
      labels: ['Paid', 'Unpaid'],
      title: {
        text: 'Paid vs. Unpaid Invoices'
      }
    };

    this.latePayments = {
      series: [{
        name: 'Late Payments',
        data: [2, 5, 3, 4, 6, 8, 7] // Example data
      }],
      chart: {
        type: 'bar',
        height: 350
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
      },
      title: {
        text: 'Late Payments by Month'
      }
    };

    this.vendorPaymentTrends = {
      series: [{
        name: 'Vendor A',
        data: [3000, 3200, 3100, 3300, 3400, 3500, 3600] // Example data
      }, {
        name: 'Vendor B',
        data: [2500, 2700, 2600, 2800, 2900, 3000, 3100]
      }],
      chart: {
        type: 'line',
        height: 350
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
      },
      title: {
        text: 'Vendor Payment Trends'
      }
    };

    this.vendorReliability = {
      series: [{
        name: 'On-time Payments',
        data: [80, 70, 90, 85, 75, 95, 90]
      }, {
        name: 'Invoice Accuracy',
        data: [70, 75, 85, 80, 90, 95, 85]
      }, {
        name: 'Issues',
        data: [2, 3, 1, 4, 2, 1, 3]
      }],
      chart: {
        type: 'radar',
        height: 350
      },
      xaxis: {
        categories: ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D', 'Vendor E', 'Vendor F', 'Vendor G']
      },
      title: {
        text: 'Vendor Reliability'
      }
    };

    this.expenseAnomalies = {
      series: [{
        name: 'Expenses',
        data: [12000, 13000, 11000, 14000, 11500, 12800, 16000] // Example data
      }],
      chart: {
        type: 'scatter',
        height: 350
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
      },
      title: {
        text: 'Expense Anomalies'
      }
    };

    this.expenseForecasting = {
      series: [{
        name: 'Expenses',
        data: [12000, 13000, 11000, 14000, 11500, 12800, 16000] // Example data
      }],
      chart: {
        type: 'line',
        height: 350
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
      },
      title: {
        text: 'Expense Forecasting'
      }
    };
  }

  async exportToExcel(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Recent Transactions');
  
    // Add super header row
    const superHeader = worksheet.addRow(['VIEWVOICE']);
    superHeader.getCell(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    superHeader.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    superHeader.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '3B82F6' } // Light blue background
    };
    superHeader.height = 40; // Adjust row height for super header
    worksheet.mergeCells('A1:G1'); // Merge cells for the super header
  
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
        fgColor: { argb: 'E5E5E5' } // Light gray background
      };
      cell.border = {
        bottom: { style: 'thin' }
      };
    });
  
    // Prepare the data rows
    this.extractedData.forEach((row, idx) => {
      const dataRow = worksheet.addRow([
        `F${idx + 1}`, // File No.
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
    // Step 1: Generate confidence labels (L1, L2, L3, ..., L{totalFilesProcessed})
    const confidenceLabels = Array.from({ length: totalFilesProcessed }, (_, index) => `F${index + 1}`);

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
        categories: confidenceLabels,  // Generated labels as categories on the x-axis
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
  container.classList.remove("hidden");

  container.appendChild(invoiceDistributionDiv.cloneNode(true));
  container.appendChild(expenseOverviewDiv.cloneNode(true));

  console.log(container);

  html2canvas(container).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4'); 

    const imgWidth = 210; 
    const pageHeight = 295; 
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    pdf.addPage();

    container.innerHTML = '';
    container.appendChild(invoiceDetailsDiv.cloneNode(true));

    html2canvas(container).then(thirdCanvas => {
      const thirdImgData = thirdCanvas.toDataURL('image/png');
      const thirdImgHeight = (thirdCanvas.height * imgWidth) / thirdCanvas.width;

      pdf.addImage(thirdImgData, 'PNG', 0, 0, imgWidth, thirdImgHeight);

      pdf.save('viewvoice-report.pdf');
      
      container.classList.add("hidden");
      container.innerHTML = "";
    });
  });
}


}
