import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import { SplitText } from 'gsap/SplitText.js';

export default class Animations {
  constructor(element) {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    this.element = element;
    this.ease = 'expo.out';
    // Laisse le temps à la transition de page (les blocs orange) de s'ouvrir
    this.introDelay = 0.6;
    // Cellulaire / tablette : version allégée (pas de découpe de texte ni d'effets décoratifs)
    this.isLight = window.matchMedia(
      '(max-width: 1024px), (pointer: coarse)',
    ).matches;

    this.init();
  }

  init() {
    // Évite un recalcul complet quand la barre d'adresse du cell apparaît/disparaît
    ScrollTrigger.config({ ignoreMobileResize: true });

    this.initProgress();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return;

    // On attend les polices pour que SplitText coupe les lignes au bon endroit
    document.fonts.ready.then(() => {
      this.initTitles();
      this.initLines();
      this.initMedias();
      this.initProjets();
      this.initPropos();
      this.initFiche();
      this.initListes();
      ScrollTrigger.refresh();
    });
  }

  // Délai seulement pour ce qui est déjà visible au chargement
  getDelay(element) {
    return element.getBoundingClientRect().top < window.innerHeight
      ? this.introDelay
      : 0;
  }

  // Apparition simple, jouée une seule fois (le déclencheur est supprimé ensuite)
  reveal(targets, vars, trigger, start = 'top 85%') {
    const items = gsap.utils.toArray(targets);
    if (!items.length) return;
    const triggerEl =
      typeof trigger === 'string'
        ? this.element.querySelector(trigger)
        : trigger || items[0];

    return gsap.from(items, {
      duration: 0.9,
      ease: this.ease,
      delay: this.getDelay(triggerEl),
      ...vars,
      scrollTrigger: { trigger: triggerEl, start, once: true },
    });
  }

  /* Barre de progression orange sous le header */
  initProgress() {
    const bar = document.querySelector('.header__progress');
    if (!bar) return;

    gsap.to(bar, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        start: 0,
        end: 'max',
        scrub: true,
      },
    });
  }

  /* Titres : lettres pour le display, lignes pour les autres */
  initTitles() {
    const titles = this.element.querySelectorAll(
      'h1, .wrapper > h2, .profil h2, .footer h2, .infos h2',
    );

    if (this.isLight) {
      titles.forEach((title) => {
        this.reveal(title, { y: 30, autoAlpha: 0 });
      });
    } else {
      titles.forEach((title) => {
        const isDisplay = title.classList.contains('display');
        // autoSplit recoupe les lignes si la largeur change
        SplitText.create(title, {
          type: isDisplay ? 'words, chars' : 'lines',
          mask: isDisplay ? 'chars' : 'lines',
          autoSplit: true,
          onSplit: (split) =>
            this.reveal(
              isDisplay ? split.chars : split.lines,
              isDisplay
                ? { yPercent: 110, duration: 1.2, stagger: 0.03 }
                : { yPercent: 105, stagger: 0.1 },
              title,
            ),
        });
      });
    }

    this.initBouton();

    this.reveal('.hub h3, .hero .contenu > p', {
      y: 30,
      autoAlpha: 0,
      delay: this.introDelay + 0.4,
    });
  }

  /* Bouton « Voir mes projets » : le bouton monte, sa ligne apparaît et la flèche glisse */
  initBouton() {
    const btn = this.element.querySelector('.hub .btn');
    if (!btn) return;
    const arrow = btn.querySelector('.icon');

    gsap.set(btn, { autoAlpha: 0, y: 30 });
    gsap.set(arrow, { autoAlpha: 0, x: -20 });

    const tl = gsap.timeline({ delay: this.introDelay + 0.6 });
    tl.to(btn, { autoAlpha: 1, y: 0, duration: 0.9, ease: this.ease })
      // clearProps rend la main au CSS pour garder la couleur orange au survol
      .from(
        btn,
        {
          borderBottomColor: 'transparent',
          duration: 0.6,
          clearProps: 'borderBottomColor',
        },
        '<0.2',
      )
      .to(
        arrow,
        { autoAlpha: 1, x: 0, duration: 0.8, ease: 'back.out(3)' },
        '<',
      );

    // Petit coup de flèche régulier pour inviter à cliquer (ordi seulement)
    if (!this.isLight) {
      tl.to(arrow, {
        x: 8,
        duration: 0.4,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: -1,
        repeatDelay: 1.6,
      });
    }
  }

  /* Les séparateurs se tracent de gauche à droite */
  initLines() {
    this.element.querySelectorAll('hr').forEach((hr) => {
      gsap.set(hr, { transformOrigin: 'left center' });
      this.reveal(
        hr,
        { scaleX: 0, duration: 1.2, ease: 'expo.inOut' },
        hr,
        'top 95%',
      );
    });
  }

  /* Photos de moi : un bloc orange balaie l'image, comme la transition de page */
  initMedias() {
    const medias = this.element.querySelectorAll('.hub .media, .hero .media');
    medias.forEach((media) => {
      const img = media.querySelector('img');
      const block = document.createElement('span');
      block.classList.add('media__reveal');
      media.appendChild(block);

      // Cachée tout de suite pour ne pas la voir avant le balayage
      gsap.set(img, { autoAlpha: 0 });
      gsap.set(block, { scaleX: 0, transformOrigin: 'left center' });

      const tl = gsap.timeline({
        delay: this.getDelay(media),
        scrollTrigger: { trigger: media, start: 'top 85%', once: true },
      });
      tl.to(block, { scaleX: 1, duration: 0.6, ease: 'expo.inOut' })
        .set(img, { autoAlpha: 1 })
        .set(block, { transformOrigin: 'right center' })
        .to(block, { scaleX: 0, duration: 0.7, ease: 'expo.inOut' });

      const caption = media.querySelector('.mini');
      if (caption) {
        tl.from(caption, { y: 10, autoAlpha: 0, duration: 0.6 }, '-=0.3');
      }
    });

    this.reveal('.presentation img', { y: 60, autoAlpha: 0, duration: 1.2 });
  }

  /* Liste des projets : les rangées glissent, le carré tourne */
  initProjets() {
    gsap.utils.toArray('.projets .card').forEach((card) => {
      const tl = gsap.timeline({
        delay: this.getDelay(card),
        scrollTrigger: { trigger: card, start: 'top 90%', once: true },
      });
      tl.from(card, { x: -60, autoAlpha: 0, duration: 0.9, ease: this.ease });

      if (!this.isLight) {
        tl.from(
          card.querySelector('.icon'),
          { rotation: -180, scale: 0, duration: 0.8, ease: 'back.out(2)' },
          0.2,
        );
      }
    });
  }

  /* Page À propos */
  initPropos() {
    this.highlight('.hero .contenu > p');

    // Barres de compétences segment par segment + compteur
    this.element.querySelectorAll('.skill').forEach((skill) => {
      const segments = skill.querySelectorAll('.skill-segment.filled');
      const counter = skill.querySelector('.skill-label .mini');
      const value = { n: 0 };
      const total = parseInt(counter.textContent, 10);
      counter.textContent = '0%';

      const tl = gsap.timeline({
        scrollTrigger: { trigger: skill, start: 'top 90%', once: true },
      });
      tl.from(segments, {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.07,
      }).to(
        value,
        {
          n: total,
          duration: segments.length * 0.07 + 0.4,
          ease: 'power2.out',
          onUpdate: () => {
            counter.textContent = `${Math.round(value.n)}%`;
          },
        },
        0,
      );
    });

    this.reveal(
      '.competence .mid .card',
      { y: 40, autoAlpha: 0, stagger: 0.08 },
      '.competence .mid',
    );

    this.reveal(
      '.competence .bot p',
      { x: -30, autoAlpha: 0, stagger: 0.08 },
      '.competence .bot',
    );

    // Galerie : une seule apparition en cascade pour toute la grille
    this.reveal(
      '.propos_gallery .card',
      { y: 60, autoAlpha: 0, stagger: 0.08 },
      '.propos_gallery .gallerie1',
      'top 90%',
    );
  }

  /* Fiches projets */
  initFiche() {
    this.reveal(
      '.projet_hero .tag, .projet_hero .voirs',
      {
        y: 30,
        autoAlpha: 0,
        stagger: 0.12,
        delay: this.introDelay + 0.3,
      },
      '.projet_hero',
    );

    this.element.querySelectorAll('.info .cards').forEach((cards) => {
      this.reveal(cards.children, { y: 40, autoAlpha: 0, stagger: 0.1 }, cards);
    });

    this.element.querySelectorAll('.etapes .card').forEach((card) => {
      this.highlight(card.querySelector('.desc'));

      this.reveal(card.querySelectorAll('.desc, .tags .tag'), {
        y: 30,
        autoAlpha: 0,
        stagger: 0.08,
      }, card);

      // La galerie apparaît d'un bloc (pas un déclencheur par image)
      this.reveal(
        card.querySelector('.gallery'),
        { y: 60, autoAlpha: 0, duration: 1.1 },
        card.querySelector('.gallery'),
        'top 90%',
      );
    });

    this.reveal('.final .video', { y: 60, autoAlpha: 0, duration: 1.1 });
  }

  /* Listes : footer, contact, IA */
  initListes() {
    this.reveal(
      '.footer .socials > a',
      { y: 30, autoAlpha: 0, stagger: 0.06 },
      '.footer .socials',
      'top 95%',
    );

    this.reveal(
      '.contact .infos li.social',
      { y: 30, autoAlpha: 0, stagger: 0.06 },
      '.contact .infos',
    );

    this.reveal(
      '.contact .input',
      { y: 30, autoAlpha: 0, stagger: 0.08 },
      '.contact .formulaire',
    );

    this.reveal(
      '.ia .item',
      { x: -40, autoAlpha: 0, stagger: 0.08 },
      '.ia .liste',
    );
  }

  // Les mots-clés passent à l'orange une fois, en cascade (ordi seulement)
  highlight(container) {
    if (this.isLight) return;
    const parent =
      typeof container === 'string'
        ? this.element.querySelector(container)
        : container;
    if (!parent) return;
    const words = parent.querySelectorAll('span');
    if (!words.length) return;

    // GSAP ne sait pas interpoler les var(), on lit la vraie couleur
    const orange = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-secondary')
      .trim();

    gsap.to(words, {
      color: orange,
      duration: 0.6,
      stagger: 0.15,
      delay: 0.4,
      scrollTrigger: { trigger: parent, start: 'top 70%', once: true },
    });
  }
}
