import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent {
  isSideBarVisible: boolean = false;


  constructor(public router: Router){

  }

  navigateToPdf() {
    this.router.navigate(['PDF-uploader']);
  }

  toggleSideBar() {
    this.isSideBarVisible = !this.isSideBarVisible;
  }
}
