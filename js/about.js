(() => {
  'use strict';

  /* ------------------------------------------------------------------
     «Задачи Ассоциации»: одна карточка раскрыта (по умолчанию первая).
     Клик (тап) по закрытой карточке раскрывает её и закрывает открытую.
     Стрелки только листают ленту на одну карточку, ничего не раскрывая.

     Разметка:
       <div class="js-tasks">
         <div class="tasks__track js-tasks-track">
           <article class="task is-active" tabindex="0">...</article>
         </div>
         <button class="js-tasks-prev"> <button class="js-tasks-next">
       </div>
     ------------------------------------------------------------------ */
  const EXPAND_DURATION = 420; // чуть дольше анимации ширины в CSS (0.4s)

  const initTasks = (root) => {
    const track = root.querySelector('.js-tasks-track');
    if (!track) return;

    const originals = [...track.querySelectorAll('.task')];
    const count = originals.length;
    if (!count) return;

    const makeCopy = (card) => {
      const copy = card.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.setAttribute('tabindex', '-1');
      return copy;
    };
    originals.forEach((card) => track.appendChild(makeCopy(card)));
    [...originals].reverse().forEach((card) => track.prepend(makeCopy(card)));

    // Все карточки по порядку: [копии][оригиналы][копии]
    const cards = [...track.querySelectorAll('.task')];

    const prev = root.querySelector('.js-tasks-prev');
    const next = root.querySelector('.js-tasks-next');
    let current = Math.max(0, originals.findIndex((card) => card.classList.contains('is-active')));

    const paddingLeft = () => parseFloat(getComputedStyle(track).paddingLeft) || 0;

    // Прокрутка без анимации (в CSS у ленты плавная прокрутка)
    const jumpTo = (left) => {
      track.style.scrollBehavior = 'auto';
      track.scrollLeft = left;
      track.style.scrollBehavior = '';
    };

    // Начало среднего набора и ширина одного набора
    const middleStart = () => cards[count].offsetLeft - paddingLeft();
    const setWidth = () => cards[count * 2].offsetLeft - cards[count].offsetLeft;

    // Если ушли за половину набора от начала среднего — переносим обратно
    const keepInMiddle = () => {
      const start = middleStart();
      const width = setWidth();
      if (track.scrollLeft < start - width / 2) jumpTo(track.scrollLeft + width);
      else if (track.scrollLeft > start + width / 2) jumpTo(track.scrollLeft - width);
    };

    // Если раскрытая карточка не видна целиком — докручиваем ленту до неё
    const revealCard = (card) => {
      const padding = paddingLeft();
      const left = card.offsetLeft - padding;
      const right = card.offsetLeft + card.offsetWidth + padding - track.clientWidth;

      if (track.scrollLeft > left) track.scrollTo({ left, behavior: 'smooth' });
      else if (track.scrollLeft < right) track.scrollTo({ left: right, behavior: 'smooth' });
    };

    // Шаг прокрутки — ширина закрытой карточки + промежуток
    const step = () => {
      const closed = cards.find((card) => !card.classList.contains('is-active')) ?? cards[0];
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return closed.offsetWidth + gap;
    };

    // Раскрываем задачу index во всех трёх наборах; clicked — карточка, по которой кликнули
    const activate = (index, clicked) => {
      current = index;

      cards.forEach((card, i) => {
        const active = i % count === index;
        card.classList.toggle('is-active', active);
        if (!card.hasAttribute('aria-hidden')) card.setAttribute('aria-expanded', String(active));
      });

      // Ждём окончания анимации ширины, чтобы учесть новые размеры
      if (clicked) setTimeout(() => revealCard(clicked), EXPAND_DURATION);
    };

    cards.forEach((card, i) => {
      card.addEventListener('click', () => {
        if (!card.classList.contains('is-active')) activate(i % count, card);
      });

      card.addEventListener('keydown', (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !card.classList.contains('is-active')) {
          event.preventDefault();
          activate(i % count, card);
        }
      });
    });

    prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));

    // Переносим ленту, когда прокрутка остановилась (scrollend есть не во всех браузерах)
    if ('onscrollend' in window) {
      track.addEventListener('scrollend', keepInMiddle);
    } else {
      let timer;
      track.addEventListener('scroll', () => {
        clearTimeout(timer);
        timer = setTimeout(keepInMiddle, 150);
      }, { passive: true });
    }

    activate(current);
    // Первая задача — у левого края экрана
    jumpTo(middleStart());
    window.addEventListener('resize', keepInMiddle);
  };

  /* ------------------------------------------------------------------
     Слайдер руководства: активный руководитель по центру и крупнее,
     соседи уменьшаются по мере удаления (как в макете).
     На мобильном все карточки одного размера, листаются пальцем.
     ------------------------------------------------------------------ */

  // Масштаб и прозрачность карточки в зависимости от удаления от центра: 0, 1, 2, 3+
  const SCALES = [1, 0.75, 0.5625, 0.42];
  const OPACITY = [1, 0.8, 0.5, 0.5];
  const SLIDE_WIDTH = 360;
  const GAP = 24;

  const desktopQuery = window.matchMedia('(min-width: 768px)');

  // Значение из списка для дробного удаления (плавно между соседними точками)
  const pick = (list, distance) => {
    const i = Math.floor(distance);
    if (i >= list.length - 1) return list[list.length - 1];
    return list[i] + (list[i + 1] - list[i]) * (distance - i);
  };

  // Расстояние от центра активной карточки до центра карточки на удалении distance
  const centerOffset = (distance) => {
    const pairWidth = (k) => (SLIDE_WIDTH * pick(SCALES, k)) / 2 + GAP + (SLIDE_WIDTH * pick(SCALES, k + 1)) / 2;
    const whole = Math.floor(distance);

    let offset = 0;
    for (let k = 0; k < whole; k += 1) offset += pairWidth(k);
    return offset + pairWidth(whole) * (distance - whole);
  };

  const resetSlide = (slide) => {
    slide.style.transform = '';
    slide.style.opacity = '';
    slide.style.zIndex = '';
    const caption = slide.querySelector('.leader__caption');
    if (caption) caption.style.opacity = '';
  };

  const applyLeaderTransforms = (swiper) => {
    for (const slide of swiper.slides) {
      if (!desktopQuery.matches) {
        resetSlide(slide);
        continue;
      }

      // progress > 0 — карточка левее активной, < 0 — правее
      const { progress } = slide;
      const distance = Math.abs(progress);
      const direction = progress > 0 ? -1 : 1;
      const natural = -progress * SLIDE_WIDTH;
      const shift = direction * centerOffset(distance) - natural;

      slide.style.transform = `translateX(${shift}px) scale(${pick(SCALES, distance)})`;
      slide.style.opacity = pick(OPACITY, distance);
      slide.style.zIndex = String(100 - Math.round(distance * 10));

      const caption = slide.querySelector('.leader__caption');
      if (caption) caption.style.opacity = Math.max(0, 1 - Math.max(0, distance - 1) * 2);
    }
  };

  const initLeaders = (root) => {
    if (typeof Swiper === 'undefined') return;

    const el = root.querySelector('.swiper');
    if (!el) return;

    const slides = [...el.querySelectorAll('.swiper-slide')];
    const slidesCount = slides.length;
    const initial = parseInt(root.dataset.initial, 10);

    /*
      Бесконечная прокрутка по кругу. Встроенный loop Swiper'а с центрированными
      слайдами разной ширины теряет нажатия на стрелки, поэтому петля своя:
      три одинаковых набора руководителей, показываем средний, а после каждой
      прокрутки без анимации возвращаемся в средний набор — глазу это незаметно.
      Копии скрыты от экранных дикторов, чтобы список не читался трижды.
    */
    const wrapper = el.querySelector('.swiper-wrapper');

    el.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; });

    const makeCopy = (slide) => {
      const copy = slide.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.setAttribute('tabindex', '-1');
      return copy;
    };
    slides.forEach((slide) => wrapper.appendChild(makeCopy(slide)));
    [...slides].reverse().forEach((slide) => wrapper.prepend(makeCopy(slide)));

    // Если ушли в первый или третий набор — переходим на тот же слайд в среднем
    const keepInMiddle = (swiper) => {
      const index = swiper.activeIndex;
      if (index < slidesCount) swiper.slideTo(index + slidesCount, 0, false);
      else if (index >= slidesCount * 2) swiper.slideTo(index - slidesCount, 0, false);
    };

    new Swiper(el, {
      slidesPerView: 'auto',
      centeredSlides: true,
      initialSlide: slidesCount + (Number.isNaN(initial) ? Math.floor(slidesCount / 2) : initial),
      loop: false,
      autoplay: false,
      spaceBetween: 0,
      watchSlidesProgress: true,
      slideToClickedSlide: false,
      navigation: {
        prevEl: root.querySelector('.js-leaders-prev'),
        nextEl: root.querySelector('.js-leaders-next'),
      },
      breakpoints: {
        0: { spaceBetween: 8 },
        768: { spaceBetween: 0 },
      },
      on: {
        progress: applyLeaderTransforms,
        transitionEnd: keepInMiddle,
        // Страховка: браузер иногда не сообщает об окончании анимации
        slideChange: (swiper) => setTimeout(() => keepInMiddle(swiper), swiper.params.speed + 50),
        resize: applyLeaderTransforms,
        breakpoint: (swiper) => setTimeout(() => applyLeaderTransforms(swiper), 0),
        setTransition: (swiper, duration) => {
          for (const slide of swiper.slides) {
            slide.style.transitionDuration = `${duration}ms`;
            const caption = slide.querySelector('.leader__caption');
            if (caption) caption.style.transitionDuration = `${duration}ms`;
          }
        },
      },
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.js-tasks').forEach(initTasks);
    document.querySelectorAll('.js-leaders').forEach(initLeaders);
  });
})();
