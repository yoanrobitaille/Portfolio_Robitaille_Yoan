export default class Drawer {
  constructor(element) {
    this.element = element;
    this.buttons = this.element.querySelectorAll('.item');

    this.init();
  }
  init() {
    for (let i = 0; i < this.buttons.length; i++) {
      const bouton = this.buttons[i];
      bouton.addEventListener('click', this.openDescription.bind(this));
    }
  }

  openDescription(event) {
    event.currentTarget.classList.toggle('is-active');
  }
}
