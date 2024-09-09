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
 totalExpenses = 85000;
 averageInvoiceAmount = 567.89;

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

 constructor(private fileService: FileUploadService) {

  this.fileService.getDataFromDB().subscribe((data:any)=>{
    this.initializeCharts(data);
  });

 }

 ngOnInit(): void {
 }

 initializeCharts(data:any) {

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

  const confidenceData = this.pdfResponse.map(j => j.jsoNcontent.PdfValues.map(i => i.Confidence));
  const confidenceLabels = this.pdfResponse.map(j => j.jsoNcontent.PdfValues.map(i => i.FieldName));

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

  // // Initialize Invoice Amount Distribution Chart

  const invoiceValues = this.pdfResponse.map(j => j.jsoNcontent.Tables.filter(t => t.TableNumber === 1).flatMap(c => c.Cells.filter(cell => cell.RowIndex === 1).map(cell => parseFloat(cell.Content.replace(/₹|,/g, ''))).filter(value => !isNaN(value))));
  const invoiceCategories = this.pdfResponse[0].jsoNcontent.PdfValues.map(i => i.FieldName);

  console.log("Invoice Values: " + invoiceValues);

  this.invoiceDistributionChart = {
    series: [
      // name: 'Invoice Amount',
      ...invoiceValues
    ],
    chart: {
      type: 'pie',
      height: 350
    },
    labels: invoiceCategories,
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

  // // Initialize Amount in Words Confidence Chart
  const amountInWordsData = this.pdfResponse.map(j => j.jsoNcontent.PdfValues.filter(item => item.FieldName === 'AmountInWords').map(item => item.Confidence));
  const labelData = this.pdfResponse[0].jsoNcontent.PdfValues.map(i => i.FieldName);

  console.log(amountInWordsData);

  this.amountInWordsChart = {
    series: [
      // name: 'Confidence',
      ...amountInWordsData
    ],
    chart: {
      type: 'radialBar',
      height: 350
    },
    labels: labelData,
    title: {
      text: 'Confidence Level for Amount in Words'
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

   this.monthlyExpensesChart = {
     series: [{
       name: 'Expenses',
       data: [4500, 5600, 4700, 5200, 5800, 6100, 6000, 6300, 7000, 7500, 7100, 7800] // Example data
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

   this.categoryWiseExpenses = {
     series: [{
       name: 'Expenses',
       data: [12000, 10000, 8000, 15000, 6000] // Example data
     }],
     chart: {
       type: 'bar',
       height: 350
     },
     xaxis: {
       categories: ['Utilities', 'Rent', 'Supplies', 'Maintenance', 'Miscellaneous']
     },
     title: {
       text: 'Category-wise Expenses'
     }
   };

   this.topVendors = {
     series: [44, 55, 13, 43, 22],
     chart: {
       type: 'pie',
       height: 350
     },
     labels: ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D', 'Vendor E'],
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

   this.invoiceCountByDate = {
     series: [{
       name: 'Invoices',
       data: [3, 8, 7, 2, 5, 10, 6, 4, 3, 8, 9, 12] // Example invoice counts
     }],
     chart: {
       type: 'heatmap',
       height: 350
     },
     xaxis: {
       categories: ['01-Aug', '02-Aug', '03-Aug', '04-Aug', '05-Aug', '06-Aug', '07-Aug', '08-Aug', '09-Aug', '10-Aug', '11-Aug', '12-Aug']
     },
     title: {
       text: 'Invoice Count by Date'
     }
   };

   this.invoiceAmountDistribution = {
     series: [{
       name: 'Invoices',
       data: [3, 8, 7, 2, 5, 10, 6, 4, 3, 8, 9, 12] // Example invoice counts
     }],
     chart: {
       type: 'heatmap',
       height: 350
     },
     xaxis: {
       categories: ['< $500', '$500-$1000', '$1000-$2000', '$2000-$3000', '$3000-$4000', '> $4000']
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
