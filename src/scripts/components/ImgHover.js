import gsap from 'gsap';

export default class ImgHover {
  constructor() {
    this.init();
  }

  init() {
    const image = document.querySelector('img.swipeimage');
    if (!image) return;

    const canHover = window.matchMedia('(hover:hover) and (pointer: fine)');
    if (!canHover.matches) {
      gsap.set(image, { display: 'none' });
      return;
    }

    gsap.set(image, { xPercent: -50, yPercent: -50, autoAlpha: 0 });

    const setX = gsap.quickTo(image, 'x', { duration: 0.4, ease: 'power3' });
    const setY = gsap.quickTo(image, 'y', { duration: 0.4, ease: 'power3' });
    let firstEnter = false;

    const align = (e) => {
      if (firstEnter) {
        setX(e.clientX, e.clientX);
        setY(e.clientY, e.clientY);
        firstEnter = false;
      } else {
        setX(e.clientX);
        setY(e.clientY);
      }
    };

    const fade = gsap.to(image, {
      autoAlpha: 1,
      duration: 0.1,
      ease: 'none',
      paused: true,
      onReverseComplete: () => document.removeEventListener('mousemove', align),
    });
    gsap.utils.toArray('.card').forEach((card) => {
      card.addEventListener('mouseenter', (e) => {
        image.src = card.dataset.img;
        // Saut direct seulement si l'image était complètement cachée,
        // sinon elle glisse d'une carte à l'autre
        firstEnter = fade.progress() === 0;
        fade.play();
        document.addEventListener('mousemove', align);
        align(e);
      });

      card.addEventListener('mouseleave', () => fade.reverse());
    });
  }
}
