"use strict";

// Значення const не перепризначаємо: ціни та промокод сталі.
const STANDARD_PRICE = 400;
const VIP_PRICE = 800;
const PROMO_CODE = "EVENT50";
const PROMO_VALUE = 50;

// Квитки та учасники мають бути додатними цілими числами.
function isValidQuantity(quantity) {
  return Number.isSafeInteger(quantity) && quantity > 0;
}

// Завдання 1. Порожні рядки (включно з пробілами) не проходять перевірку.
function validateRegistration(name, email, participants) {
  const errors = {};

  if (name.trim() === "") {
    errors.name = "Вкажіть своє ім’я.";
  }

  if (email.trim() === "") {
    errors.email = "Вкажіть email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = "Вкажіть коректний email, наприклад you@example.com.";
  }

  if (!isValidQuantity(participants)) {
    errors.participants = "Введіть цілу кількість учасників, більшу за нуль.";
  }

  return errors;
}

// Завдання 2 і 3. Функція лише рахує; виведення на сторінку — нижче.
function calculateOrder(quantity, category, promoCode) {
  if (!isValidQuantity(quantity)) {
    throw new Error("Введіть цілу кількість квитків, більшу за нуль.");
  }

  let ticketPrice;
  if (category === "vip") {
    ticketPrice = VIP_PRICE;
  } else if (category === "standard") {
    ticketPrice = STANDARD_PRICE;
  } else {
    throw new Error("Оберіть категорію Standard або VIP.");
  }

  const subtotal = quantity * ticketPrice;
  if (!Number.isSafeInteger(subtotal)) {
    throw new Error("Кількість квитків завелика для точного розрахунку.");
  }

  // Спочатку перевіряємо найбільшу знижку, щоб умови не перетиналися.
  let discountPercent = 0;
  if (quantity >= 5) {
    discountPercent = 20;
  } else if (quantity >= 3 && quantity <= 4) {
    discountPercent = 10;
  } else {
    discountPercent = 0;
  }

  const quantityDiscount = subtotal * (discountPercent / 100);
  const afterQuantityDiscount = subtotal - quantityDiscount;
  const normalizedPromo = promoCode.trim().toUpperCase();

  let promoDiscount = 0;
  if (normalizedPromo === PROMO_CODE) {
    promoDiscount = PROMO_VALUE;
  }

  // Промокод застосовується ПІСЛЯ відсоткової знижки.
  let total = afterQuantityDiscount - promoDiscount;
  if (total < 0) {
    total = 0;
  }

  return {
    quantity, category, ticketPrice, subtotal, discountPercent,
    quantityDiscount, promoDiscount, total,
    hasUnknownPromo: normalizedPromo !== "" && normalizedPromo !== PROMO_CODE
  };
}

function formatMoney(amount) {
  return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 }).format(amount) + " грн";
}

// Цей блок працює у браузері. Функції вище можна перевіряти окремо.
if (typeof document !== "undefined") {
  const registrationForm = document.getElementById("registration-form");
  const nameInput = document.getElementById("participant-name");
  const emailInput = document.getElementById("participant-email");
  const participantsInput = document.getElementById("participant-count");
  const registrationMessage = document.getElementById("registration-message");
  const ticketForm = document.getElementById("ticket-form");
  const ticketCountInput = document.getElementById("ticket-count");
  const promoInput = document.getElementById("promo-code");
  const calculationMessage = document.getElementById("calculation-message");
  const summary = document.getElementById("order-summary");
  const pendingMessage = document.getElementById("calculation-pending");

  function showMessage(element, text, type) {
    // textContent не дозволяє перетворити введений текст на HTML.
    element.textContent = text;
    element.className = "alert alert-" + type + " mt-3 mb-0";
    element.hidden = false;
  }

  function setFieldError(input, errorId, message) {
    input.classList.toggle("is-invalid", Boolean(message));
    input.setAttribute("aria-invalid", String(Boolean(message)));
    if (message) {
      document.getElementById(errorId).textContent = message;
    }
  }

  registrationForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Навчальна форма не перезавантажує сторінку.
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const participants = Number(participantsInput.value);
    const errors = validateRegistration(name, email, participants);

    setFieldError(nameInput, "name-error", errors.name);
    setFieldError(emailInput, "email-error", errors.email);
    setFieldError(participantsInput, "participants-error", errors.participants);

    if (Object.keys(errors).length === 0) {
      showMessage(registrationMessage, "Реєстрація успішна!", "success");
    } else {
      showMessage(registrationMessage, "Перевірте форму: виправте позначені поля.", "danger");
      registrationForm.querySelector(".is-invalid").focus();
    }
  });

  // Після редагування прибираємо застаріле повідомлення про успіх/помилку.
  registrationForm.addEventListener("input", function (event) {
    registrationMessage.hidden = true;
    event.target.classList.remove("is-invalid");
    event.target.removeAttribute("aria-invalid");
  });

  function renderOrder(order) {
    document.getElementById("summary-category").textContent = order.category.toUpperCase();
    document.getElementById("summary-multiplication").textContent = order.quantity + " × " + formatMoney(order.ticketPrice);
    document.getElementById("subtotal").textContent = formatMoney(order.subtotal);
    document.getElementById("discount-percent").textContent = order.discountPercent + "%";
    document.getElementById("quantity-discount").textContent = (order.quantityDiscount > 0 ? "−" : "") + formatMoney(order.quantityDiscount);
    document.getElementById("summary-promo").textContent = order.promoDiscount > 0 ? PROMO_CODE : "не застосовано";
    document.getElementById("promo-discount").textContent = (order.promoDiscount > 0 ? "−" : "") + formatMoney(order.promoDiscount);
    document.getElementById("total-price").textContent = formatMoney(order.total);
    summary.hidden = false;
    pendingMessage.hidden = true;
  }

  ticketForm.addEventListener("submit", function (event) {
    event.preventDefault();
    calculationMessage.hidden = true;
    pendingMessage.hidden = true;
    setFieldError(ticketCountInput, "ticket-count-error", "");
    const quantity = Number(ticketCountInput.value);
    const category = ticketForm.querySelector('input[name="category"]:checked').value;

    try {
      const order = calculateOrder(quantity, category, promoInput.value);
      renderOrder(order);
      if (order.hasUnknownPromo) {
        showMessage(calculationMessage, "Промокод не знайдено. Суму розраховано без промокоду. Спробуйте EVENT50.", "warning");
      }
    } catch (error) {
      summary.hidden = true;
      setFieldError(ticketCountInput, "ticket-count-error", error.message);
      showMessage(calculationMessage, error.message, "danger");
      ticketCountInput.focus();
    }
  });

  ticketForm.addEventListener("input", function () {
    summary.hidden = true;
    calculationMessage.hidden = true;
    pendingMessage.hidden = false;
    setFieldError(ticketCountInput, "ticket-count-error", "");
  });
}
