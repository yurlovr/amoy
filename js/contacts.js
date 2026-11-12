(() => {
  'use strict';

  /*
    Карта на странице «Контакты» (contacts.html): статичная, одна метка.
    Карту нельзя двигать и масштабировать — ни мышью, ни колесом, ни пальцами.
    Карточка с фото, адресом и почтой — обычная разметка в contacts.html.

    Координаты — Поварская ул., 30-36, стр. 3 (Российская академия музыки имени Гнесиных).
  */

  const ORGANISATION_COORDS = [55.756133, 37.590515];
  const ZOOM = 14;

  // Та же метка, что на карте членов Ассоциации (js/maps.js)
  const PIN_ICON = "data:image/svg+xml;utf8,<svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M16.0015 29.3335C15.3295 30.2295 15.329 30.2291 15.329 30.2291L15.3259 30.2268L15.3184 30.2212C15.3121 30.2164 15.3033 30.2097 15.292 30.2012C15.2695 30.184 15.2372 30.1592 15.1956 30.127C15.1126 30.0627 14.9929 29.9687 14.8416 29.8472C14.5392 29.6042 14.1105 29.2504 13.5973 28.8014C12.5726 27.9048 11.2036 26.6217 9.83108 25.0776C7.13858 22.0486 4.21484 17.776 4.21484 13.3335C4.21484 5.95857 10.1433 1.54688 16.0015 1.54688C21.8597 1.54688 27.7882 5.95857 27.7882 13.3335C27.7882 17.776 24.8644 22.0486 22.1719 25.0776C20.7994 26.6217 19.4304 27.9048 18.4057 28.8014C17.8926 29.2504 17.4638 29.6042 17.1614 29.8472C17.0102 29.9687 16.8904 30.0627 16.8074 30.127C16.7659 30.1592 16.7335 30.184 16.711 30.2012C16.6997 30.2097 16.6909 30.2164 16.6846 30.2212L16.6771 30.2268L16.6741 30.2291C16.6741 30.2291 16.6735 30.2295 16.0015 29.3335ZM16.0015 29.3335L16.6741 30.2291L16.0015 30.7335L15.329 30.2291L16.0015 29.3335ZM10.8815 13.3335C10.8815 10.5056 13.1736 8.21354 16.0015 8.21354C18.8294 8.21354 21.1215 10.5056 21.1215 13.3335C21.1215 16.1614 18.8294 18.4535 16.0015 18.4535C13.1736 18.4535 10.8815 16.1614 10.8815 13.3335ZM16.0015 10.4535C14.4107 10.4535 13.1215 11.7428 13.1215 13.3335C13.1215 14.9243 14.4107 16.2135 16.0015 16.2135C17.5923 16.2135 18.8815 14.9243 18.8815 13.3335C18.8815 11.7428 17.5923 10.4535 16.0015 10.4535Z' fill-rule='evenodd' clip-rule='evenodd' fill='%23C02E95'/><circle cx='16.5' cy='13.5' r='6.5' fill='%23C02E95'/></svg>";

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
      iconImageSize: [32, 45],
      iconImageOffset: [-16, -45],
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
