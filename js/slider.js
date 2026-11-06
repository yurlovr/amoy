(function () {
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

  var presets = {
    // Галерея внутри текста: слайды фиксированной ширины 310px
    gallery: {
      slidesPerView: 'auto',
      spaceBetween: 16,
      breakpoints: {
        768: { spaceBetween: 32 }
      }
    },

    // Карточки новостей / событий: 1 → 2 → 4 в ряд
    cards: {
      slidesPerView: 1.15,
      spaceBetween: 8,
      breakpoints: {
        768: { slidesPerView: 2, spaceBetween: 24 },
        1200: { slidesPerView: 4, spaceBetween: 24 }
      }
    }
  };

  function initSliders() {
    if (typeof Swiper === 'undefined') return;

    document.querySelectorAll('.js-slider').forEach(function (root) {
      var el = root.querySelector('.swiper');
      if (!el) return;

      var preset = presets[root.getAttribute('data-slider')] || presets.gallery;
      var options = {
        loop: false,
        autoplay: false,
        watchOverflow: true,
        observer: true,
        observeParents: true,
        navigation: {
          prevEl: root.querySelector('.js-slider-prev'),
          nextEl: root.querySelector('.js-slider-next')
        },
        a11y: {
          prevSlideMessage: 'Предыдущий слайд',
          nextSlideMessage: 'Следующий слайд'
        }
      };

      Object.keys(preset).forEach(function (key) {
        options[key] = preset[key];
      });

      new Swiper(el, options);
    });
  }

  document.addEventListener('DOMContentLoaded', initSliders);
})();
