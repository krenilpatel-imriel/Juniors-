import { Component, OnInit } from '@angular/core';
import { FileResponse, PdfResponse } from 'src/app/Models/fileResponseModel';
import { FileUploadService } from 'src/app/services/fileUpload.service';
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
  totalGrandTotal: number = 0;
  monthlyExpenses = new Array(12).fill(0);
  invoiceCountsByDate: { [key: string]: number } = {};
  invoiceCategories: string[] = [];


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
    this.extractedData = []; // Clear any previous data

    this.pdfResponse.forEach((record: PdfResponse) => {
      const extractedRow: any = {};

      // Iterate through PdfValues to extract fields like GrandTotal, OrderDate, etc.
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
    // this.calculateTotalGrandTotal();

    // const confidenceData = this.pdfResponse.map(j => j.jsoNcontent.PdfValues.map(i => i.Confidence));
    // const confidenceLabels = this.pdfResponse.map(j => j.jsoNcontent.PdfValues.map(i => i.FieldName));

    // Flatten the PdfValues arrays into a single array
    const totalFilesProcessed = this.pdfResponse.length; // Or any other way to calculate total files processed
    this.generateConfidenceChart(totalFilesProcessed, this.pdfResponse);

    // this.confidenceChart = {
    //   series: [{
    //     name: 'Confidence Level',
    //     data: confidenceData ? confidenceData : []
    //   }],
    //   chart: {
    //     type: 'bar',
    //     height: 350
    //   },
    //   labels: confidenceLabels,
    //   xaxis: {
    //     categories: confidenceLabels
    //   },
    //   title: {
    //     text: 'Confidence Levels by Field'
    //   }
    // };

    // // Extract TotalTaxAmount and GrandTotal from the PdfResponse
    // const invoiceValues = this.pdfResponse
    //   .flatMap(j =>
    //     j.jsoNcontent.PdfValues
    //       .filter(i => (i.FieldName === 'TotalTaxAmount' || i.FieldName === 'GrandTotal') && i.FieldValue !== null)
    //       .map(i => i.FieldValue ? parseFloat(i.FieldValue.replace(/₹|,/g, '')) : 0) // Parse the amount, remove currency symbols
    //   )
    //   .filter(value => !isNaN(value)); // Filter out any NaN values
    //   console.log("invoiceValues", this.pdfResponse.map(j => j.jsoNcontent.PdfValues))
    // // Extract categories for the chart (FieldName for TotalTaxAmount and GrandTotal)
    // if(this.pdfResponse && this.pdfResponse[0] && this.pdfResponse[0].jsoNcontent.PdfValues){
    //   this.invoiceCategories = this.pdfResponse[0].jsoNcontent.PdfValues
    //     .filter(i => (i.FieldName === 'TotalTaxAmount' || i.FieldName === 'GrandTotal') && i.FieldValue !== null)
    //     .map(i => i.FieldName);
    // }

    // // Log to verify the extracted data
    // // console.log("Invoice Values:", invoiceValues);
    // // console.log("Invoice Categories:", this.invoiceCategories);

    // // Update the chart configuration with TotalTaxAmount and GrandTotal values
    // this.invoiceDistributionChart = {
    //   series: invoiceValues ? invoiceValues : [], // Valid invoice values
    //   chart: {
    //     type: 'pie',
    //     height: 350
    //   },
    //   labels: this.invoiceCategories, // Corresponding FieldName for TotalTaxAmount and GrandTotal
    //   title: {
    //     text: 'Invoice Amount Distribution'
    //   },
    //   responsive: [
    //     {
    //       breakpoint: 480,
    //       options: {
    //         chart: {
    //           width: 200
    //         },
    //         legend: {
    //           position: 'bottom'
    //         }
    //       }
    //     }
    //   ]
    // };

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
      totalTaxAmount += parseFloat(taxAmountValue); // Safely parse the value
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

    // console.log("grandtotal", this.extractedData);
    // Iterate through the extracted data
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
      },
      title: {
        text: 'Monthly Expenses'
      }
    };



    // Create an object to hold the totals for each BillToName
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

    // Extract labels (vendor names) and data (totals) from the vendorTotals object
    const vendorLabels = Object.keys(vendorTotals); // BillToName values
    const vendorData = Object.values(vendorTotals).map(total => parseFloat(total.toFixed(2))); // Corresponding GrandTotal values

    // Now that we have the totals, update the pie chart data
    this.topVendors = {
      series: vendorData, // Use the accumulated GrandTotal values
      chart: {
        type: 'pie',
        height: 350
      },
      labels: vendorLabels, // Use the BillToName values as labels
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
        categories: categories // Use the formatted dates as categories
      },
      title: {
        text: 'Invoice Count by Date'
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
        categories: categoriesPrice
      },
      title: {
        text: 'Invoice Amount Distribution'
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
    worksheet.mergeCells('A1:D1'); // Merge cells for the super header

    // Define the header
    const header = ['Date', 'Amount', 'Order Id', 'Vendor'];

    // Add header row
    const headerRow = worksheet.addRow(header);

    // Apply header styling (light green background)
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '90EE90' } // Light green background
      };
      cell.border = {
        bottom: { style: 'thin' }
      };
    });

    // Prepare the data rows
    this.extractedData.forEach(row => {
      const dataRow = worksheet.addRow([
        row.OrderDate || 'N/A',
        `₹${row.GrandTotal || 'N/A'}`,
        `${row.OrderNo || 'N/A'}`,
        `${row.SoldByName || 'N/A'}`
      ]);

      // Make amount values bold and green
      dataRow.getCell(2).font = { bold: true, color: { argb: '008000' } }; // Green color
    });

    // Add the total row
    const totalRow = worksheet.addRow([
      '', // Empty cell for Date
      `Grand Total: ₹${this.totalGrandTotal.toFixed(2)}`, // Amount
      '', // Empty cell for Order Id
      ''
    ]);

    // Make grand total bold
    totalRow.getCell(2).font = { bold: true };

    // Apply styling to all rows (make the rest of the rows white)
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      row.height = 25; // Increase row height
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center and middle alignment
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
    worksheet.getColumn(1).width = 20; // Date column
    worksheet.getColumn(2).width = 25; // Amount column
    worksheet.getColumn(3).width = 50; // Description column
    worksheet.getColumn(4).width = 50;

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
    const confidenceLabels = Array.from({ length: totalFilesProcessed }, (_, index) => `L${index + 1}`);

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

    // You can then render this chart using your chart rendering library
    // Example:
    // ApexCharts, Chart.js, etc., depending on what you're using.
  }



}
