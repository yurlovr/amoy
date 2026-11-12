(() => {
  'use strict';

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  const params = new URLSearchParams(window.location.search);

  /* ------------------------------------------------------------------
     Главный слайдер: бесконечный, автопрокрутка каждые 5 секунд.
     Меняются только фоновые картинки, текст стоит на месте.
     ------------------------------------------------------------------ */
  const initHeroSlider = () => {
    const el = document.querySelector('.js-hero-slider');
    if (!el || typeof Swiper === 'undefined') return;

    new Swiper(el, {
      loop: true,
      speed: 800,
      effect: 'fade',
      fadeEffect: { crossFade: true },
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      navigation: {
        prevEl: '.js-hero-prev',
        nextEl: '.js-hero-next',
      },
      pagination: {
        el: '.js-hero-pagination',
        clickable: true,
      },
      a11y: {
        prevSlideMessage: 'Предыдущий слайд',
        nextSlideMessage: 'Следующий слайд',
        paginationBulletMessage: 'Перейти к слайду {{index}}',
      },
    });
  };

  const initLogButtons = () => {
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-log]');
      if (!target) return;

      event.preventDefault();
    });
  };

  /* ------------------------------------------------------------------
     Мобильное меню
     ------------------------------------------------------------------ */
  const initMobileMenu = () => {
    const menu = document.querySelector('.js-mobile-menu');
    const openBtn = document.querySelector('.js-menu-open');
    if (!menu || !openBtn) return;

    const setOpen = (isOpen) => {
      menu.classList.toggle('is-open', isOpen);
      menu.setAttribute('aria-hidden', String(!isOpen));
      openBtn.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('is-locked', isOpen);
    };

    openBtn.addEventListener('click', () => setOpen(true));

    menu.addEventListener('click', (event) => {
      if (event.target.closest('.js-menu-close, a')) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
    });

    // Меню скрывается на десктопе — снимаем блокировку прокрутки
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (mq) => {
      if (mq.matches) setOpen(false);
    });
  };

  /* ------------------------------------------------------------------
     Вкладки «Новости / События», «Список / Карта».
     Кнопки: [data-tab="news"], панели: [data-panel="news"].
     Открыть нужную вкладку по ссылке: news.html?tab=events
     ------------------------------------------------------------------ */
  const initTabs = () => {
    const root = document.querySelector('.js-tabs');
    if (!root) return;

    const buttons = [...root.querySelectorAll('[data-tab]')];
    const panels = document.querySelectorAll('[data-panel]');
    if (!buttons.length) return;

    const activate = (name, updateUrl) => {
      if (!buttons.some((btn) => btn.dataset.tab === name)) return false;

      for (const btn of buttons) {
        const isActive = btn.dataset.tab === name;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-selected', String(isActive));
      }

      for (const panel of panels) {
        panel.hidden = panel.dataset.panel !== name;
      }

      if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', name);
        url.searchParams.delete('page');
        window.history.replaceState(null, '', url);
      }

      // Сообщаем остальным скриптам (например, карте), какая вкладка открыта
      document.dispatchEvent(new CustomEvent('tabs:change', { detail: { name } }));

      return true;
    };

    for (const btn of buttons) {
      btn.addEventListener('click', () => activate(btn.dataset.tab, true));
    }

    if (!activate(params.get('tab'), false)) {
      activate(buttons[0].dataset.tab, false);
    }
  };

  /* ------------------------------------------------------------------
     Детальная страница: новость или событие (new.html?type=events).
     Пока данные статичные, тип берётся из адреса. На PHP это можно
     отрендерить сразу на сервере и этот блок станет не нужен.
       [data-detail-type="news|events"] — показывается только для своего типа
       [data-type-href="news.html?tab={type}"] — ссылка с подстановкой типа
       [data-text-news] / [data-text-events] — текст для каждого типа
     ------------------------------------------------------------------ */
  const initDetailType = () => {
    if (!document.querySelector('[data-detail-type], [data-type-href], [data-text-news]')) return;

    const type = params.get('type') === 'events' ? 'events' : 'news';

    for (const el of document.querySelectorAll('[data-detail-type]')) {
      el.hidden = el.dataset.detailType !== type;
    }

    for (const el of document.querySelectorAll('[data-type-href]')) {
      el.href = el.dataset.typeHref.replace('{type}', type);
    }

    for (const el of document.querySelectorAll(`[data-text-${type}]`)) {
      el.textContent = el.getAttribute(`data-text-${type}`);
    }
  };

  /* ------------------------------------------------------------------
     Стрелки «предыдущий / следующий член Ассоциации» по кругу:
     с первого «назад» — на последнего, с последнего «вперёд» — на первого.
     Разметка: <div class="js-member-nav" data-total="32"> + ссылки
     .js-member-prev / .js-member-next. Текущий номер — из ?id= в адресе.
     На PHP ссылки можно сразу выводить с сервера, тогда скрипт не нужен.
     ------------------------------------------------------------------ */
  const initMemberNav = () => {
    const nav = document.querySelector('.js-member-nav');
    if (!nav) return;

    const total = parseInt(nav.dataset.total, 10);
    if (!total) return;

    let id = parseInt(params.get('id'), 10);
    if (!(id >= 1 && id <= total)) id = 1;

    const prev = id === 1 ? total : id - 1;
    const next = id === total ? 1 : id + 1;

    const prevLink = nav.querySelector('.js-member-prev');
    const nextLink = nav.querySelector('.js-member-next');
    if (prevLink) prevLink.href = `member.html?id=${prev}`;
    if (nextLink) nextLink.href = `member.html?id=${next}`;
  };

  document.addEventListener('DOMContentLoaded', () => {
    initDetailType();
    initMemberNav();
    initHeroSlider();
    initLogButtons();
    initMobileMenu();
    initTabs();
  });
})();
