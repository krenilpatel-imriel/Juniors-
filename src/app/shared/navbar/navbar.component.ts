import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faUserCircle, faCaretDown, faBars } from '@fortawesome/free-solid-svg-icons';
import { gsap } from 'gsap';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  logoUrl = '../../../../assets/Logo.png'
  isNavbarOpen = false;

  constructor(private rotuer: Router){

  }


navigateToContact(){
  this.rotuer.navigate(['/contact']);
  }

  toggleNavbar() {
    this.isNavbarOpen = !this.isNavbarOpen;
  }
  }

