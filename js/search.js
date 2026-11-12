(() => {
  'use strict';

  /*
    Поиск по сайту.

    Открыть: любой элемент с data-search-open (кнопка с лупой в шапке и в мобильном меню).
    Закрыть: крестик (на мобильном — стрелка назад), клик по затемнению, Esc.
    При закрытии введённый запрос и результаты очищаются.

    Поиск идёт по мере ввода (от 2 символов). Показываются все найденные
    результаты; если их много, список прокручивается внутри блока.
    Если ничего нет — «Ничего не найдено».

    Сейчас ищем по демо-данным DEMO_DATA ниже. Для PHP заменить функцию
    findResults на запрос к серверу, например:
      const response = await fetch(`/search.php?q=${encodeURIComponent(query)}`);
      return response.json(); // [{ title, section, date, url }, ...]
    Формат результата: { title, section, date, url }.
  */

  const MIN_LENGTH = 2;
  const DEBOUNCE = 300;

  // На десктопе поиск — окно поверх страницы, на мобильном — на весь экран
  const desktopQuery = window.matchMedia('(min-width: 768px)');

  /*
    Демо-данные. Каждый результат ведёт на свою страницу:
      новость  — new.html?type=news&id=N
      событие  — new.html?type=events&id=N
      член Ассоциации — member.html?id=N (номер — как в списке на members.html)
    На PHP адреса будут приходить с сервера в поле url.
  */
  const NEWS = [
    ['Научный рецензируемый журнал «Сфера культуры» Самарского государственного института культуры вновь стал грантообладателем Российского фонда культуры', '18.07.2026'],
    ['3 октября 2025 года в Екатеринбурге члены Ассоциации приняли участие в Деловой программе VIII Симфонического форума России', '22.07.2026'],
    ['В марте 2024 года Московская средняя специальная музыкальная школа (колледж) имени Гнесиных проводит три конкурса проекта «Gnessin Competition for Young Musicians»', '22.07.2026'],
    ['Журнал Балтийский культурный форум 2024', '29.07.2026'],
  ];

  const EVENTS = [
    ['IX Международный конкурс молодых исполнителей на духовых и ударных инструментах «Сибирские музыкальные ассамблеи»', '29.06.2026'],
    ['Шестой межрегиональный Фестиваль-смотр выпускников музыкальных училищ (колледжей искусств) пройдёт в Москве с 28 сентября по 2 октября 2026 года', '22.07.2026'],
    ['29–30 сентября 2026 года в Тамбове состоится Вторая всероссийская творческая лаборатория для молодых композиторов «Прима Домра»', '22.07.2026'],
    ['«Журналистские Читки» объединили две Ассоциации', '19.03.2026'],
    ['Общее собрание членов Ассоциации', '22.07.2026'],
  ];

  const MEMBERS = [
    'Автономная некоммерческая организация культуры центр творчества «Максимум»',
    'Академия хорового искусства имени В.С.Попова',
    'Академическое музыкальное училище при Московской государственной консерватории имени П.И.Чайковского',
    'Архангельский музыкальный колледж',
    'Астраханская государственная консерватория',
    'Астраханский музыкальный колледж имени М.П. Мусоргского',
    'Башкирский республиканский колледж культуры и искусства',
    'Белорусская государственная академия музыки',
    'Брянский областной колледж искусств',
    'Владимирский областной музыкальный колледж им. А.П. Бородина',
    'Волгоградская государственная консерватория имени П.А. Серебрякова',
    'Волжские культурные инициативы',
    'Воронежский государственный институт искусств',
    'Восточно-Сибирский государственный институт культуры',
    'Высшая школа музыки Республики Саха (Якутия) (институт) имени В.А.Босикова',
    'Гнесинская академия музыки',
    'Дальневосточный государственный институт искусств',
    'Екатеринбургский музыкальный колледж имени П.И. Чайковского',
    'Забайкальский краевой колледж искусств',
    'Ивановский музыкальный колледж',
    'Казанская государственная консерватория имени Н.Г. Жиганова',
    'Красноярский колледж искусств имени П.И. Иванова-Радкевича',
    'Липецкий областной колледж искусств им. К.Н. Игумнова',
    'Монгольский государственный университет культуры и искусств',
    'Нижегородская государственная консерватория имени М.И. Глинки',
    'Новосибирская специальная музыкальная школа',
    'Омский музыкальный колледж имени В.Я. Шебалина',
    'Пермский краевой колледж искусств и культуры',
    'Ростовская государственная консерватория имени С.В. Рахманинова',
    'Самарский государственный институт культуры',
    'Тамбовский государственный музыкально-педагогический институт имени С.В. Рахманинова',
    'Уральская государственная консерватория имени М.П. Мусоргского',
  ];

  const DEMO_DATA = [
    ...NEWS.map(([title, date], i) => ({ title, section: 'Новости', date, url: `new.html?type=news&id=${i + 1}` })),
    ...EVENTS.map(([title, date], i) => ({ title, section: 'События', date, url: `new.html?type=events&id=${i + 1}` })),
    ...MEMBERS.map((title, i) => ({ title, section: 'Члены Ассоциации', date: '', url: `member.html?id=${i + 1}` })),
  ];

  // Поиск без учёта регистра и разницы «е/ё»
  const normalize = (text) => text.toLowerCase().replace(/ё/g, 'е');

  const findResults = async (query) => {
    const q = normalize(query);
    return DEMO_DATA.filter((item) => normalize(item.title).includes(q));
  };

  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const createItem = ({ title, section, date, url }) => {
    const link = document.createElement('a');
    link.className = 'search__item';
    link.href = url;

    const titleEl = document.createElement('span');
    titleEl.className = 'search__title';
    titleEl.textContent = title;

    const metaEl = document.createElement('span');
    metaEl.className = 'search__meta';
    metaEl.textContent = date ? `${section}, ${date}` : section;

    link.append(titleEl, metaEl);
    return link;
  };

  const initSearch = (root) => {
    const input = root.querySelector('.js-search-input');
    const clear = root.querySelector('.js-search-clear');
    const results = root.querySelector('.js-search-results');
    const list = root.querySelector('.js-search-list');
    const empty = root.querySelector('.js-search-empty');
    const form = root.querySelector('.js-search-form');
    if (!input || !results) return;

    let lastFocused = null;
    let requestId = 0;

    const showResults = (items) => {
      list.replaceChildren(...items.map(createItem));
      list.scrollTop = 0;

      const found = items.length > 0;
      list.hidden = !found;
      empty.hidden = found;
      results.hidden = false;
    };

    const runSearch = async () => {
      const query = input.value.trim();
      clear.hidden = input.value === '';

      if (query.length < MIN_LENGTH) {
        results.hidden = true;
        return;
      }

      // Отбрасываем ответ, если пользователь уже ввёл что-то новое
      const id = ++requestId;
      const items = await findResults(query);
      if (id === requestId) showResults(items);
    };

    const debouncedSearch = debounce(runSearch, DEBOUNCE);

    const open = () => {
      lastFocused = document.activeElement;
      root.classList.add('is-open');
      root.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      setTimeout(() => input.focus(), 50);
    };

    // Сбрасываем введённый запрос и результаты
    const reset = () => {
      requestId += 1; // ответ на старый запрос, если ещё придёт, будет проигнорирован
      input.value = '';
      clear.hidden = true;
      results.hidden = true;
      list.replaceChildren();
    };

    const close = () => {
      if (!root.classList.contains('is-open')) return;
      reset();
      root.classList.remove('is-open');
      root.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      if (lastFocused?.offsetParent) lastFocused.focus();
    };

    document.addEventListener('click', (event) => {
      const opener = event.target.closest('[data-search-open]');
      if (opener) {
        event.preventDefault();
        // Если открыто мобильное меню — закрываем его
        document.querySelector('.js-mobile-menu.is-open .js-menu-close')?.click();
        open();
        return;
      }

      if (!root.classList.contains('is-open')) return;
      // Крестик / стрелка назад или клик по затемнению (только на десктопе) закрывают поиск
      const onBackdrop = desktopQuery.matches && !event.target.closest('.search__inner');
      if (event.target.closest('[data-search-close]') || onBackdrop) close();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
    });

    input.addEventListener('input', debouncedSearch);

    // Enter или кнопка с лупой — искать сразу, без ожидания
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      runSearch();
    });

    clear?.addEventListener('click', () => {
      reset();
      input.focus();
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.js-search').forEach(initSearch);
  });
})();
