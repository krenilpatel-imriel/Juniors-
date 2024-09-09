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


@Component({
  selector: 'app-insights',
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss']
})
export class InsightsComponent {

 // KPI Data
 totalFilesProcessed = 150;
 successfulFiles = 140;
 failedFiles = 10;
 totalExpenses = 0;
 averageInvoiceAmount = 0;

 // Chart Data
 processingSuccessFail: any;
 processingTimeDistribution: any;
 monthlyExpensesChart: any;
 categoryWiseExpenses: any;
 topVendors: any;
 invoiceCountByDate: any;
 invoiceAmountDistribution: any;
 top10LargestInvoices: any;
 paidUnpaidInvoices: any;
 latePayments: any;
 vendorPaymentTrends: any;
 vendorReliability: any;
 expenseAnomalies: any;
 expenseForecasting: any;

 // Chart Data
 pdfResponse!: PdfResponse[];
 confidenceChart: any;
 invoiceDistributionChart: any;
 amountInWordsChart: any;
 extractedData: any[] = [];
 totalGrandTotal: number = 0;
monthlyExpenses = new Array(12).fill(0);
invoiceCountsByDate: { [key: string]: number } = {};


 constructor(private fileService: FileUploadService) {

  this.fileService.getDataFromDB().subscribe((data:any)=>{
    this.initializeCharts(data);
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


 initializeCharts(data:any) {
  console.log(data);
  this.pdfResponse = data.records.map((record: any) => {
    if (typeof record.jsoNcontent === 'string') {
      try {
        record.jsoNcontent = JSON.parse(record.jsoNcontent);
      } catch (error) {
        console.error('Error parsing JSON content:', error);
      }
    }
    console.log(record);

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

  const confidenceData = this.pdfResponse.map(j => j.jsoNcontent.PdfValues.map(i => i.Confidence));
  const confidenceLabels = this.pdfResponse.map(j => j.jsoNcontent.PdfValues.map(i => i.FieldName));
  console.log(confidenceData);
  console.log(confidenceLabels);

  this.confidenceChart = {
    series: [{
      name: 'Confidence Level',
      data: confidenceData
    }],
    chart: {
      type: 'bar',
      height: 350
    },
    labels: confidenceLabels,
    xaxis: {
      categories: confidenceLabels
    },
    title: {
      text: 'Confidence Levels by Field'
    }
  };

// Extract TotalTaxAmount and GrandTotal from the PdfResponse
const invoiceValues = this.pdfResponse
  .flatMap(j =>
    j.jsoNcontent.PdfValues
      .filter(i => (i.FieldName === 'TotalTaxAmount' || i.FieldName === 'GrandTotal') && i.FieldValue !== null)
      .map(i => i.FieldValue ? parseFloat(i.FieldValue.replace(/₹|,/g, '')) : 0) // Parse the amount, remove currency symbols
  )
  .filter(value => !isNaN(value)); // Filter out any NaN values

// Extract categories for the chart (FieldName for TotalTaxAmount and GrandTotal)
const invoiceCategories = this.pdfResponse[0].jsoNcontent.PdfValues
  .filter(i => (i.FieldName === 'TotalTaxAmount' || i.FieldName === 'GrandTotal') && i.FieldValue !== null)
  .map(i => i.FieldName);

// Log to verify the extracted data
console.log("Invoice Values:", invoiceValues);
console.log("Invoice Categories:", invoiceCategories);

// Update the chart configuration with TotalTaxAmount and GrandTotal values
this.invoiceDistributionChart = {
  series: invoiceValues, // Valid invoice values
  chart: {
    type: 'pie',
    height: 350
  },
  labels: invoiceCategories, // Corresponding FieldName for TotalTaxAmount and GrandTotal
  title: {
    text: 'Invoice Amount Distribution'
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
     series: [this.successfulFiles, this.failedFiles],
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

   console.log("grandtotal", this.extractedData);
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
    data: formattedMonthlyExpenses // Use the calculated monthly expenses
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
      data: datedata // Use the calculated invoice counts
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
       data: dataPrice// Example invoice counts
     }],
     chart: {
       type: 'heatmap',
       height: 350
     },
     xaxis: {
       categories:categoriesPrice
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
}
