(function () {
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

  function initFilter(root) {
    var list = root.querySelector('.js-filter-list');
    if (!list) return;

    var items = Array.prototype.slice.call(list.querySelectorAll('.js-filter-item'));
    var sortButtons = root.querySelectorAll('[data-sort]');
    var letterButtons = root.querySelectorAll('[data-letter]');
    var empty = root.querySelector('.js-filter-empty');

    var params = new URLSearchParams(window.location.search);
    var state = {
      sort: params.get('sort') === 'desc' ? 'desc' : 'asc',
      letter: (params.get('letter') || '').toUpperCase()
    };

    function getName(item) {
      return item.textContent.trim();
    }

    function render() {
      // Сортировка по названию
      var sorted = items.slice().sort(function (a, b) {
        var result = getName(a).localeCompare(getName(b), 'ru');
        return state.sort === 'desc' ? -result : result;
      });
      sorted.forEach(function (item) {
        list.appendChild(item);
      });

      // Фильтр: название начинается с выбранной буквы
      var visible = 0;
      items.forEach(function (item) {
        var match = !state.letter || getName(item).charAt(0).toUpperCase() === state.letter;
        item.hidden = !match;
        if (match) visible++;
      });

      if (empty) empty.hidden = visible > 0;

      sortButtons.forEach(function (btn) {
        var active = btn.getAttribute('data-sort') === state.sort;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      letterButtons.forEach(function (btn) {
        var active = btn.getAttribute('data-letter') === state.letter;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    function updateUrl() {
      if (!window.history.replaceState) return;
      var url = new URL(window.location.href);
      url.searchParams.delete('page');
      if (state.sort === 'desc') url.searchParams.set('sort', 'desc');
      else url.searchParams.delete('sort');
      if (state.letter) url.searchParams.set('letter', state.letter);
      else url.searchParams.delete('letter');
      window.history.replaceState(null, '', url);
    }

    sortButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.sort = btn.getAttribute('data-sort');
        render();
        updateUrl();
      });
    });

    // Повторный клик по активной букве сбрасывает фильтр
    letterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var letter = btn.getAttribute('data-letter');
        state.letter = state.letter === letter ? '' : letter;
        render();
        updateUrl();
      });
    });

    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.js-filter').forEach(initFilter);
  });
})();
