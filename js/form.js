(() => {
  'use strict';

  /*
    Модальные окна и форма обратной связи.

    Открыть окно: любой элемент с data-modal-open="feedback"
    (кнопка-чат в шапке, «Связаться с нами» в футере).
    Закрыть: крестик, клик по затемнению, Esc.

    Проверка формы:
      - обязательные поля помечены атрибутом required;
      - ошибка показывается после ухода с поля или при попытке отправки;
      - кнопка «Отправить» неактивна, пока форма не заполнена правильно.

    Отправка: сейчас данные выводятся в консоль и показывается сообщение
    об успехе. Для PHP заменить блок submit на fetch(form.action, ...)
    или убрать preventDefault и отправлять форму обычным способом.
  */

  let openedModal = null;
  let lastFocused = null;

  const openModal = (modal) => {
    if (!modal) return;

    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    openedModal = modal;

    // Сообщаем содержимому окна, что оно открылось (форма сбрасывает «Спасибо»)
    modal.dispatchEvent(new CustomEvent('modal:open'));

    const first = modal.querySelector('input') ?? modal.querySelector('button, a');
    if (first) setTimeout(() => first.focus(), 50);
  };

  const closeModal = () => {
    if (!openedModal) return;

    openedModal.classList.remove('is-open');
    openedModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    openedModal = null;

    // Возвращаем фокус, только если элемент ещё виден (не в закрытом мобильном меню)
    if (lastFocused?.offsetParent) lastFocused.focus();
  };

  const initModals = () => {
    document.addEventListener('click', (event) => {
      const opener = event.target.closest('[data-modal-open]');
      if (opener) {
        event.preventDefault();
        // Если открыто мобильное меню — закрываем его
        document.querySelector('.js-mobile-menu.is-open .js-menu-close')?.click();
        openModal(document.getElementById(`modal-${opener.dataset.modalOpen}`));
        return;
      }

      if (!openedModal) return;
      if (event.target.closest('[data-modal-close]') || event.target === openedModal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeModal();
    });
  };

  /* ---------- Проверка полей ---------- */

  const messages = {
    required: 'Заполните поле',
    email: 'Введите корректный адрес почты',
    tel: 'Введите номер телефона, например +7 999 123-45-67',
  };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const TEL_RE = /^[\d\s()+-]+$/;

  const fieldError = (input) => {
    const value = input.value.trim();

    if (input.required && !value) return messages.required;
    if (!value) return '';

    if (input.type === 'email' && !EMAIL_RE.test(value)) return messages.email;

    if (input.type === 'tel') {
      const digits = value.replace(/\D/g, '');
      if (!TEL_RE.test(value) || digits.length < 10 || digits.length > 15) return messages.tel;
    }

    return '';
  };

  const showError = (input, text) => {
    const field = input.closest('.field');
    if (!field) return;

    field.classList.toggle('is-invalid', Boolean(text));
    input.setAttribute('aria-invalid', String(Boolean(text)));

    const error = field.querySelector('.field__error');
    if (error) error.textContent = text;
  };

  const initForm = (form) => {
    const inputs = [...form.querySelectorAll('.field__input')];
    const agree = form.querySelector('.js-form-agree');
    const submit = form.querySelector('[type="submit"]');
    const success = form.parentNode.querySelector('.js-form-success');

    const isValid = () => inputs.every((input) => !fieldError(input)) && (!agree || agree.checked);

    const updateSubmit = () => {
      if (submit) submit.disabled = !isValid();
    };

    for (const input of inputs) {
      input.addEventListener('blur', () => showError(input, fieldError(input)));

      input.addEventListener('input', () => {
        // Пока пользователь исправляет ошибку — убираем её, как только поле стало верным
        if (input.closest('.field').classList.contains('is-invalid') && !fieldError(input)) {
          showError(input, '');
        }
        updateSubmit();
      });
    }

    // Крестик очищает поле
    for (const btn of form.querySelectorAll('.field__clear')) {
      btn.addEventListener('click', () => {
        const input = btn.closest('.field').querySelector('.field__input');
        input.value = '';
        input.focus();
        updateSubmit();
      });
    }

    agree?.addEventListener('change', updateSubmit);

    // Ссылки-заглушки в тексте согласия не должны прокручивать страницу под окном
    for (const link of form.querySelectorAll('a[href="#"]')) {
      link.addEventListener('click', (event) => event.preventDefault());
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      let firstInvalid = null;
      for (const input of inputs) {
        const text = fieldError(input);
        showError(input, text);
        if (text && !firstInvalid) firstInvalid = input;
      }

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      if (agree && !agree.checked) return;

      const data = Object.fromEntries(new FormData(form));
      console.log('[АМОУ] Форма обратной связи отправлена:', data);

      form.reset();
      updateSubmit();
      form.hidden = true;
      if (success) success.hidden = false;
    });

    // При каждом открытии окна показываем пустую форму, а не «Спасибо»
    form.closest('.modal')?.addEventListener('modal:open', () => {
      if (!form.hidden) return;
      form.hidden = false;
      if (success) success.hidden = true;
    });

    updateSubmit();
  };

  document.addEventListener('DOMContentLoaded', () => {
    initModals();
    document.querySelectorAll('.js-form').forEach(initForm);
  });
})();
