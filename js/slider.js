(() => {
  'use strict';

  /*
    Слайдеры внутренних страниц. Без автопрокрутки и без бесконечной прокрутки:
    количество слайдов конечное (сколько пришло из CMS).
    Если листать нечего, Swiper сам прячет стрелки (watchOverflow).

    Разметка:
      <div class="js-slider" data-slider="gallery|cards">
        <div class="swiper"> <div class="swiper-wrapper"> ...слайды... </div> </div>
        <button class="js-slider-prev"></button>
        <button class="js-slider-next"></button>
      </div>
  */

  const presets = {
    // Галерея внутри текста: ширина слайдов задаётся в CSS
    // (десктоп — два фото в колонке, мобильный — 310px)
    gallery: {
      slidesPerView: 'auto',
      spaceBetween: 8,
      breakpoints: {
        768: { spaceBetween: 24 },
      },
    },

    // Карточки новостей / событий: фиксированная ширина 312px (задаётся в CSS),
    // сколько поместится — столько и видно
    cards: {
      slidesPerView: 'auto',
      spaceBetween: 8,
      breakpoints: {
        768: { spaceBetween: 24 },
      },
    },
  };

  const initSliders = () => {
    if (typeof Swiper === 'undefined') return;

    for (const root of document.querySelectorAll('.js-slider')) {
      const el = root.querySelector('.swiper');
      if (!el) continue;

      const preset = presets[root.dataset.slider] ?? presets.gallery;

      new Swiper(el, {
        loop: false,
        autoplay: false,
        watchOverflow: true,
        observer: true,
        observeParents: true,
        navigation: {
          prevEl: root.querySelector('.js-slider-prev'),
          nextEl: root.querySelector('.js-slider-next'),
        },
        a11y: {
          prevSlideMessage: 'Предыдущий слайд',
          nextSlideMessage: 'Следующий слайд',
        },
        ...preset,
      });
    }
  };

  document.addEventListener('DOMContentLoaded', initSliders);
})();
