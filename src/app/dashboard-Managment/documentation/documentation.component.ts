import { AfterViewInit, Component, OnInit } from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.scss']
})
export class DocumentationComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    // Animate the title and description of the overview section
    gsap.from('.overview-section h1', {
      duration: 1,
      y: -30,
      opacity: 0,
      ease: 'power4.out'
    });

    gsap.from('.overview-section p', {
      duration: 1,
      y: 30,
      opacity: 0,
      ease: 'power4.out',
      delay: 0.3
    });

    // Animate each step with a stagger effect
    gsap.from('.step', {
      duration: 1,
      y: 50,
      opacity: 0,
      ease: 'power4.out',
      stagger: 0.3,
      delay: 0.5
    });

    // Animate the FAQ section
    gsap.from('.faq', {
      duration: 1,
      y: 50,
      opacity: 0,
      ease: 'power4.out',
      stagger: 0.3,
      delay: 0.8
    });
  }

}
