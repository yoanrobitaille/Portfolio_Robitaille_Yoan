import { ScrollSmoother } from 'gsap/ScrollSmoother.js';

export default class Modale {
  constructor(element) {
    this.element = element;
    this.smoother = ScrollSmoother.get();
    this.init();
  }
  init() {
    const images = document.querySelectorAll('.gallery img');
    const modal = document.querySelector('.modal');
    const modalImg = document.querySelector('.modalImg');
    const modalTxt = document.querySelector('.modaltxt');
    const close = document.querySelector('.close');

    modal.addEventListener('click', () => {
      modal.classList.remove('appear');
      if (this.smoother) this.smoother.paused(false);
    });

    images.forEach((image) => {
      image.addEventListener('click', () => {
        modalImg.src = image.src;
        modalTxt.innerHTML = image.alt;
        modal.classList.add('appear');
        if (this.smoother) this.smoother.paused(true);

        close.addEventListener('click', () => {
          modal.classList.remove('appear');
          if (this.smoother) this.smoother.paused(false);
        });
      });
    });
  }
}
