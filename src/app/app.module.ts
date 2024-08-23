import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomePageComponent } from './dashboard-Managment/home-page/home-page.component';
import { SideNavComponent } from './shared/side-nav/side-nav.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PDFUploaderComponent } from './dashboard-Managment/pdf-uploader/pdf-uploader.component';
import { FileSizePipe } from './dashboard-Managment/Utils/fileSizePipe/file-size.pipe';
import { ContactComponent } from './dashboard-Managment/contact/contact.component';
import { LandingPageComponent } from './dashboard-Managment/landing-page/landing-page.component';
import { DocumentationComponent } from './dashboard-Managment/documentation/documentation.component';
import { InsightsComponent } from './dashboard-Managment/insights/insights.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';


@NgModule({
  declarations: [
    AppComponent,
    HomePageComponent,
    SideNavComponent,
    NavbarComponent,
    PDFUploaderComponent,
    FileSizePipe,
    ContactComponent,
    LandingPageComponent,
    DocumentationComponent,
    InsightsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FontAwesomeModule,
    NgApexchartsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
