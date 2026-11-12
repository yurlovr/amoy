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

    const cards = [...track.querySelectorAll('.task')];
    if (!cards.length) return;

    const prev = root.querySelector('.js-tasks-prev');
    const next = root.querySelector('.js-tasks-next');
    let current = Math.max(0, cards.findIndex((card) => card.classList.contains('is-active')));

    const maxScroll = () => track.scrollWidth - track.clientWidth;

    // Если раскрытая карточка не видна целиком — докручиваем ленту до неё
    const revealCard = (card) => {
      const padding = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      const left = card.offsetLeft - padding;
      const right = card.offsetLeft + card.offsetWidth + padding - track.clientWidth;

      let target = track.scrollLeft;
      if (track.scrollLeft > left) target = left;
      else if (track.scrollLeft < right) target = right;

      track.scrollTo({ left: Math.max(0, Math.min(target, maxScroll())), behavior: 'smooth' });
    };

    // Стрелки неактивны, когда листать дальше некуда
    const updateArrows = () => {
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= maxScroll() - 2;
    };

    // Шаг прокрутки — ширина закрытой карточки + промежуток
    const step = () => {
      const closed = cards.find((card) => !card.classList.contains('is-active')) ?? cards[0];
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return closed.offsetWidth + gap;
    };

    const activate = (index) => {
      if (index < 0 || index >= cards.length) return;
      current = index;

      cards.forEach((card, i) => {
        const active = i === index;
        card.classList.toggle('is-active', active);
        card.setAttribute('aria-expanded', String(active));
      });

      // Ждём окончания анимации ширины, чтобы учесть новые размеры
      setTimeout(() => {
        revealCard(cards[index]);
        updateArrows();
      }, EXPAND_DURATION);
    };

    cards.forEach((card, i) => {
      card.addEventListener('click', () => {
        if (i !== current) activate(i);
      });

      card.addEventListener('keydown', (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && i !== current) {
          event.preventDefault();
          activate(i);
        }
      });
    });

    prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));

    track.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);

    activate(current);
    track.scrollLeft = 0;
    updateArrows();
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

    const slidesCount = el.querySelectorAll('.swiper-slide').length;
    const initial = parseInt(root.dataset.initial, 10);

    new Swiper(el, {
      slidesPerView: 'auto',
      centeredSlides: true,
      initialSlide: Number.isNaN(initial) ? Math.floor(slidesCount / 2) : initial,
      loop: true,
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
