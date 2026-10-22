import { gsap } from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother.js';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin.js';

export default class Scroller {
  constructor(element) {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin);
    this.options = {
      hasPinItems: false,
    };
    this.element = element;
    this.setOptions();
    this.init();
  }
  init() {
    this.scroller = ScrollSmoother.create({
      smooth: 1.5,
      effects: true,
      smoothTouch: 0.1,

      ease: 'expo.out',
    });
    const scrollBtn = document
      .querySelectorAll('.scrollto')
      .forEach((scrollBtn) => {
        scrollBtn.addEventListener('click', this.initScrollTo.bind(this));
      });

    this.handleInitialHash();
  }

  initScrollTo(e) {
    e.preventDefault();
    const target = document.querySelector('#projets');
    if (target) {
      this.scroller.scrollTo('#projets', true, 'top top');
    } else {
      window.location.href = './index.html#projets';
    }
  }

  handleInitialHash() {
    const hash = window.location.hash;
    if (!hash || hash === '#') return;
    window.addEventListener('load', () => {
      setTimeout(() => {
        const target = document.querySelector(hash);
        if (!target) {
          return;
        }
        ScrollTrigger.refresh();
        this.scroller.scrollTo(hash, true, 'top top');
      }, 500);
    });
  }

  initPins() {
    console.log('pin');
    const pinnedItems = this.element.querySelectorAll('.js-pinned');
    ScrollTrigger.matchMedia({
      '(min-width:1024px)': () => {
        for (let i = 0; i < pinnedItems.length; i++) {
          const pinnedItem = pinnedItems[i];
          ScrollTrigger.create({
            pin: pinnedItem,
            trigger: pinnedItem.parentElement,
            pinSpacing: false,
            start: '0 10%',
            end: '90% 70%',
            // markers: true,
          });
        }
      },
    });
  }

  setOptions() {
    if ('pinItems' in this.element.dataset) {
      this.options.hasPinItems = true;
      console.log('test');
      this.initPins();
    }
  }
}
