import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './dashboard-Managment/home-page/home-page.component';
import { SideNavComponent } from './shared/side-nav/side-nav.component';
import { PDFUploaderComponent } from './dashboard-Managment/pdf-uploader/pdf-uploader.component';
import { ContactComponent } from './dashboard-Managment/contact/contact.component';
import { LandingPageComponent } from './dashboard-Managment/landing-page/landing-page.component';
import { DocumentationComponent } from './dashboard-Managment/documentation/documentation.component';
import { InsightsComponent } from './dashboard-Managment/insights/insights.component';

const routes: Routes = [
  {path:'', component: LandingPageComponent},
  {path:'PDF-uploader', component: PDFUploaderComponent},
  {path:'contact', component: ContactComponent},
  {path:'doc', component: DocumentationComponent},
  {path:'insights', component: InsightsComponent}
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
