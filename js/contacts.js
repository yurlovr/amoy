(() => {
  'use strict';

  /*
    Карта на странице «Контакты» (contacts.html): статичная, одна метка.
    Карту нельзя двигать и масштабировать — ни мышью, ни колесом, ни пальцами.
    Карточка с фото, адресом и почтой — обычная разметка в contacts.html.
  */

  const ORGANISATION_COORDS = [55.756133, 37.590515];
  const ZOOM = 14;

  // Метка организации — всегда в состоянии «выбрана» (макет: button/locations, press/selected)
  const PIN_ICON = 'icons/pin-active.svg';

  // Всё, чем пользователь может двигать или масштабировать карту
  const INTERACTIONS = [
    'drag',
    'scrollZoom',
    'dblClickZoom',
    'multiTouch',
    'rightMouseButtonMagnifier',
    'leftMouseButtonMagnifier',
  ];

  // Все стандартные кнопки Яндекс.Карт убираем
  const CONTROLS = [
    'geolocationControl',
    'searchControl',
    'trafficControl',
    'typeSelector',
    'fullscreenControl',
    'zoomControl',
    'rulerControl',
  ];

  const mobileQuery = window.matchMedia('(max-width: 767px)');

  const initContactsMap = () => {
    const el = document.getElementById('map-block-contacts');
    if (!el) return;

    const map = new ymaps.Map(el, {
      center: ORGANISATION_COORDS,
      zoom: ZOOM,
      controls: [],
    });

    CONTROLS.forEach((name) => map.controls.remove(name));
    map.behaviors.disable(INTERACTIONS);

    map.geoObjects.add(new ymaps.Placemark(ORGANISATION_COORDS, {}, {
      iconLayout: 'default#image',
      iconImageHref: PIN_ICON,
      iconImageSize: [32, 32],
      iconImageOffset: [-16, -31],
      hasBalloon: false,
      cursor: 'default',
    }));

    /*
      На мобильном карточка закрывает низ карты — сдвигаем центр так,
      чтобы метка оказалась посередине видимой над карточкой части.
    */
    const card = document.querySelector('.js-contacts-card');

    const placePin = () => {
      map.container.fitToViewport();

      if (!mobileQuery.matches || !card) {
        map.setCenter(ORGANISATION_COORDS, ZOOM);
        return;
      }

      const projection = map.options.get('projection');
      const pixels = projection.toGlobalPixels(ORGANISATION_COORDS, ZOOM);
      pixels[1] += card.offsetHeight / 2;
      map.setCenter(projection.fromGlobalPixels(pixels, ZOOM), ZOOM);
    };

    placePin();
    window.addEventListener('resize', placePin);
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof ymaps === 'undefined') return;
    ymaps.ready(initContactsMap);
  });
})();
