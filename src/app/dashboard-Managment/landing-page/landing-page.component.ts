import { AfterViewInit, Component, OnInit } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);


@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements AfterViewInit {

  constructor() { }

  ngAfterViewInit() {
    this.setupScrollAnimations();
  }

  setupScrollAnimations() {
    // Hero Section Animation
    gsap.from(".hero-section", {
      x: -200,
      opacity: 0,
      duration: 1.2,
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // Features Section Animation
    gsap.from(".feature-card", {
      x: 200,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      scrollTrigger: {
        trigger: ".feature-card",
        start: "top 90%",
        toggleActions: "play none none none"
      }
    });

    // How It Works Section Animation
    gsap.from(".how-it-works-card", {
      y: 100,
      opacity: 0,
      duration: 1.2,
      stagger: 0.2,
      scrollTrigger: {
        trigger: ".how-it-works-card",
        start: "top 90%",
        toggleActions: "play none none none"
      }
    });

    // Use Cases Section Animation
    gsap.from(".use-case-card", {
      x: -200,
      opacity: 0,
      duration: 1,
      stagger: 0.3,
      scrollTrigger: {
        trigger: ".use-case-card",
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });

    gsap.utils.toArray('h2').forEach((h2: any) => {
      gsap.from(h2, {
        y: -50, // coming from top
        opacity: 0,
        duration: 1,
        scrollTrigger: {
          trigger: h2,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        }
      });
    });

     // Features Section Animation
     gsap.from(".footer", {
      x: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      scrollTrigger: {
        trigger: ".footer",
        start: "top 90%",
        toggleActions: "play none none none"
      }
    });
// Features Section Animation
gsap.from(".logomenu", {
  y: -100,
  opacity: 0,
  duration: 1,
  stagger: 0.2,
  scrollTrigger: {
    trigger: ".logomenu",
    start: "top 90%",
    toggleActions: "play none none none"
  }
});
  }
}
