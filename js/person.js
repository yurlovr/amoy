(() => {
  'use strict';

  /*
    Карточка руководителя: стрелки переключают на другого руководителя по кругу.
    Все руководители лежат в разметке блоками [data-person], видим один.
    Номер открытого берётся из адреса: about-detail.html?id=2 (с единицы).
    Название в хлебных крошках подставляется из имени руководителя.

    На PHP можно выводить одного руководителя, а стрелки делать ссылками
    на соседних — тогда этот скрипт не нужен.
  */

  const SITE_NAME = 'Ассоциация музыкальных образовательных учреждений';

  // Имя из заголовка: <br> между фамилией и именем превращаем в пробел
  const getName = (el) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = el.innerHTML.replace(/<br\s*\/?>/gi, ' ');
    return tmp.textContent.replace(/\s+/g, ' ').trim();
  };

  const initPersons = (root) => {
    const persons = [...root.querySelectorAll('[data-person]')];
    if (!persons.length) return;

    const prev = root.querySelector('.js-person-prev');
    const next = root.querySelector('.js-person-next');
    const crumb = document.querySelector('.js-person-crumb');

    const id = parseInt(new URLSearchParams(window.location.search).get('id'), 10);
    let current = id >= 1 && id <= persons.length ? id - 1 : 0;

    const show = (index, updateUrl) => {
      current = (index + persons.length) % persons.length;

      persons.forEach((person, i) => {
        person.hidden = i !== current;
      });

      const nameEl = persons[current].querySelector('.person__name');
      if (nameEl) {
        const name = getName(nameEl);
        if (crumb) crumb.textContent = name;
        document.title = `${name} — ${SITE_NAME}`;
      }

      if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set('id', current + 1);
        window.history.replaceState(null, '', url);
      }
    };

    prev?.addEventListener('click', () => show(current - 1, true));
    next?.addEventListener('click', () => show(current + 1, true));

    // Если руководитель один — стрелки не нужны
    if (persons.length < 2 && prev) prev.parentNode.hidden = true;

    show(current, false);
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.js-persons').forEach(initPersons);
  });
})();
