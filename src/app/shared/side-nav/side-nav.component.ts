import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent implements AfterViewInit{
  isSideBarVisible: boolean = false;


  constructor(public router: Router){

  }
  ngAfterViewInit(): void {
    gsap.from('.navlink', {
      duration: 1,
      x: -100,  // Move the logo from above
      opacity: 0,  // Start from invisible
      ease: 'power4.out',
      stagger:0.2,
    });
  }

  navigateToPdf() {
    this.router.navigate(['PDF-uploader']);
  }

  toggleSideBar() {
    this.isSideBarVisible = !this.isSideBarVisible;
  }
}
