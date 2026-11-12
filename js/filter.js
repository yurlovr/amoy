(() => {
  'use strict';

  /*
    Сортировка и фильтр по первой букве для списка членов Ассоциации.

    Разметка:
      <div class="js-filter">
        <button data-sort="asc">  <button data-sort="desc">
        <button data-letter="А"> ...
        <ul class="js-filter-list">
          <li class="js-filter-item"><a>Название</a></li>
        </ul>
        <p class="js-filter-empty" hidden>Ничего не найдено</p>
      </div>

    Сейчас фильтр работает на странице в браузере. Выбранные параметры
    пишутся в адрес (?sort=desc&letter=Б), поэтому при переходе на PHP
    их можно читать на сервере и отдавать уже отфильтрованный список
    с учётом пагинации.
  */

  const getName = (item) => item.textContent.trim();

  const initFilter = (root) => {
    const list = root.querySelector('.js-filter-list');
    if (!list) return;

    const items = [...list.querySelectorAll('.js-filter-item')];
    const sortButtons = root.querySelectorAll('[data-sort]');
    const letterButtons = root.querySelectorAll('[data-letter]');
    const empty = root.querySelector('.js-filter-empty');

    const params = new URLSearchParams(window.location.search);
    const state = {
      sort: params.get('sort') === 'desc' ? 'desc' : 'asc',
      letter: (params.get('letter') ?? '').toUpperCase(),
    };

    const setPressed = (btn, active) => {
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    };

    const render = () => {
      // Сортировка по названию
      const direction = state.sort === 'desc' ? -1 : 1;
      const sorted = [...items].sort((a, b) => direction * getName(a).localeCompare(getName(b), 'ru'));
      list.append(...sorted);

      // Фильтр: название начинается с выбранной буквы
      let visible = 0;
      for (const item of items) {
        const match = !state.letter || getName(item).charAt(0).toUpperCase() === state.letter;
        item.hidden = !match;
        if (match) visible += 1;
      }

      if (empty) empty.hidden = visible > 0;

      for (const btn of sortButtons) setPressed(btn, btn.dataset.sort === state.sort);
      for (const btn of letterButtons) setPressed(btn, btn.dataset.letter === state.letter);
    };

    const updateUrl = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('page');

      if (state.sort === 'desc') url.searchParams.set('sort', 'desc');
      else url.searchParams.delete('sort');

      if (state.letter) url.searchParams.set('letter', state.letter);
      else url.searchParams.delete('letter');

      window.history.replaceState(null, '', url);
    };

    for (const btn of sortButtons) {
      btn.addEventListener('click', () => {
        state.sort = btn.dataset.sort;
        render();
        updateUrl();
      });
    }

    // Повторный клик по активной букве сбрасывает фильтр
    for (const btn of letterButtons) {
      btn.addEventListener('click', () => {
        const { letter } = btn.dataset;
        state.letter = state.letter === letter ? '' : letter;
        render();
        updateUrl();
      });
    }

    render();
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.js-filter').forEach(initFilter);
  });
})();
