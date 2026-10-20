import Carousel from './components/Carousel.js';
import Scrolly from './components/Scrolly.js';
import Youtube from './components/Youtube.js';
import Cursor from './components/Cursor.js';
import Scroller from './components/Scroller.js';
import Modale from './components/Modale.js';
import Form from './components/Form.js';
import Grid from './components/Grid.js';
import ImgHover from './components/ImgHover.js';
import Header from './components/Header.js';
import Transition from './components/Transition.js';
import Drawer from './components/Drawer.js';
export default class ComponentFactory {
  constructor() {
    this.componentInstances = [];
    this.componentList = {
      Scrolly,
      Carousel,
      Youtube,
      Cursor,
      Scroller,
      Modale,
      Form,
      Grid,
      ImgHover,
      Header,
      Transition,
      Drawer,
    };
    this.init();
  }
  init() {
    const components = document.querySelectorAll('[data-component]');

    for (let i = 0; i < components.length; i++) {
      const element = components[i];
      const componentName = element.dataset.component;

      if (this.componentList[componentName]) {
        const instance = new this.componentList[componentName](element);
        this.componentInstances.push(instance);
      } else {
        console.log(`La composante ${componentName} n'existe pas`);
      }
    }
  }
}
