(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Главный слайдер: бесконечный, автопрокрутка каждые 5 секунд.
     Меняются только фоновые картинки, текст стоит на месте.
     ------------------------------------------------------------------ */
  function initHeroSlider() {
    var el = document.querySelector('.js-hero-slider');
    if (!el || typeof Swiper === 'undefined') return;

    new Swiper(el, {
      loop: true,
      speed: 800,
      effect: 'fade',
      fadeEffect: { crossFade: true },
      autoplay: {
        delay: 5000,
        disableOnInteraction: false
      },
      navigation: {
        prevEl: '.js-hero-prev',
        nextEl: '.js-hero-next'
      },
      pagination: {
        el: '.js-hero-pagination',
        clickable: true
      },
      a11y: {
        prevSlideMessage: 'Предыдущий слайд',
        nextSlideMessage: 'Следующий слайд',
        paginationBulletMessage: 'Перейти к слайду {{index}}'
      }
    });
  }

  /* ------------------------------------------------------------------
     Временные обработчики: кнопки с data-log пишут сообщение в консоль.
     Пример: <button data-log="Поиск">
     ------------------------------------------------------------------ */
  function initLogButtons() {
    document.addEventListener('click', function (event) {
      var target = event.target.closest('[data-log]');
      if (!target) return;

      event.preventDefault();
      console.log('[АМОУ] Нажата кнопка: ' + target.getAttribute('data-log'));
    });
  }

  /* ------------------------------------------------------------------
     Мобильное меню
     ------------------------------------------------------------------ */
  function initMobileMenu() {
    var menu = document.querySelector('.js-mobile-menu');
    var openBtn = document.querySelector('.js-menu-open');
    if (!menu || !openBtn) return;

    function open() {
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      openBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-locked');
    }

    function close() {
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
    }

    openBtn.addEventListener('click', open);

    menu.addEventListener('click', function (event) {
      if (event.target.closest('.js-menu-close') || event.target.closest('a')) {
        close();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) close();
    });

    // Меню скрывается на десктопе — снимаем блокировку прокрутки
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) {
      if (mq.matches) close();
    });
  }

  /* ------------------------------------------------------------------
     Вкладки «Новости / События».
     Кнопки: [data-tab="news"], панели: [data-panel="news"].
     Открыть нужную вкладку по ссылке: news.html?tab=events
     ------------------------------------------------------------------ */
  function initTabs() {
    var root = document.querySelector('.js-tabs');
    if (!root) return;

    var buttons = root.querySelectorAll('[data-tab]');
    var panels = document.querySelectorAll('[data-panel]');

    function activate(name, updateUrl) {
      var found = false;

      buttons.forEach(function (btn) {
        var isActive = btn.getAttribute('data-tab') === name;
        if (isActive) found = true;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      if (!found) return false;

      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-panel') !== name;
      });

      if (updateUrl && window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set('tab', name);
        url.searchParams.delete('page');
        window.history.replaceState(null, '', url);
      }

      return true;
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activate(btn.getAttribute('data-tab'), true);
      });
    });

    var fromUrl = new URLSearchParams(window.location.search).get('tab');
    if (!fromUrl || !activate(fromUrl, false)) {
      activate(buttons[0].getAttribute('data-tab'), false);
    }
  }

  /* ------------------------------------------------------------------
     Детальная страница: новость или событие (new.html?type=events).
     Пока данные статичные, тип берётся из адреса. На PHP это можно
     отрендерить сразу на сервере и этот блок станет не нужен.
       [data-detail-type="news|events"] — показывается только для своего типа
       [data-type-href="news.html?tab={type}"] — ссылка с подстановкой типа
       [data-text-news] / [data-text-events] — текст для каждого типа
     ------------------------------------------------------------------ */
  function initDetailType() {
    var typed = document.querySelectorAll('[data-detail-type], [data-type-href], [data-text-news]');
    if (!typed.length) return;

    var type = new URLSearchParams(window.location.search).get('type') === 'events' ? 'events' : 'news';

    document.querySelectorAll('[data-detail-type]').forEach(function (el) {
      el.hidden = el.getAttribute('data-detail-type') !== type;
    });

    document.querySelectorAll('[data-type-href]').forEach(function (el) {
      el.setAttribute('href', el.getAttribute('data-type-href').replace('{type}', type));
    });

    document.querySelectorAll('[data-text-' + type + ']').forEach(function (el) {
      el.textContent = el.getAttribute('data-text-' + type);
    });
  }

  /* ------------------------------------------------------------------
     Стрелки «предыдущий / следующий член Ассоциации» по кругу:
     с первого «назад» — на последнего, с последнего «вперёд» — на первого.
     Разметка: <div class="js-member-nav" data-total="32"> + ссылки
     .js-member-prev / .js-member-next. Текущий номер — из ?id= в адресе.
     На PHP ссылки можно сразу выводить с сервера, тогда скрипт не нужен.
     ------------------------------------------------------------------ */
  function initMemberNav() {
    var nav = document.querySelector('.js-member-nav');
    if (!nav) return;

    var total = parseInt(nav.getAttribute('data-total'), 10);
    if (!total) return;

    var id = parseInt(new URLSearchParams(window.location.search).get('id'), 10);
    if (!id || id < 1 || id > total) id = 1;

    var prev = id === 1 ? total : id - 1;
    var next = id === total ? 1 : id + 1;

    var prevLink = nav.querySelector('.js-member-prev');
    var nextLink = nav.querySelector('.js-member-next');
    if (prevLink) prevLink.setAttribute('href', 'member.html?id=' + prev);
    if (nextLink) nextLink.setAttribute('href', 'member.html?id=' + next);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDetailType();
    initMemberNav();
    initHeroSlider();
    initLogButtons();
    initMobileMenu();
    initTabs();
  });
})();
