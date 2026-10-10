import { availabilityTranslator } from "./machuPicchuAvailabilityI18n";
import {
  fetchCalendarAvailability,
  MACHU_PICCHU_ROUTES,
  MACHU_PICCHU_PLACE_ID,
} from "./calendarAvailability";

function initMachuPicchuCalendar() {
  const root = document.getElementById("calendarDays");
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = "true";
  const lang = document.querySelector("[data-availability-lang]").dataset
    .availabilityLang;
  const translate = availabilityTranslator(lang);
  let requestId;
  try {
    requestId = sessionStorage.getItem("machuPicchuRequestId");
    if (
      !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(
        requestId || "",
      )
    ) {
      requestId = crypto.randomUUID();
      sessionStorage.setItem("machuPicchuRequestId", requestId);
    }
  } catch {
    requestId = crypto.randomUUID();
  }
  document.getElementById("bookingReference").textContent =
    `MP-${requestId.replaceAll("-", "").slice(0, 12).toUpperCase()}`;
  let availability = { dates: {}, times: {} };
  let loadState = "loading";
  let requestController;
  const circuitSelect = document.getElementById("circuitSelect");
  circuitSelect.innerHTML = "";
  MACHU_PICCHU_ROUTES.forEach((route) => {
    const option = document.createElement("option");
    option.value = route.code;
    option.textContent = `${translate(route.circuit)} / ${translate("Ruta")} ${route.code}: ${translate(route.name)}`;
    option.selected = route.code === "2A";
    circuitSelect.appendChild(option);
  });
  // ===== Datos de meses =====
  const todayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const todayPart = (type) =>
    Number(todayParts.find((part) => part.type === type).value);
  const today = {
    year: todayPart("year"),
    month: todayPart("month") - 1,
    day: todayPart("day"),
  };
  const monthNames = Array.from({ length: 12 }, (_, month) =>
    new Intl.DateTimeFormat(lang, { month: "long", timeZone: "UTC" }).format(
      new Date(Date.UTC(2026, month, 1)),
    ),
  );
  const makeMonths = (year) =>
    monthNames.map((label, month) => ({
      label,
      name: `${label} ${year}`,
      year,
      month,
    }));
  let months = makeMonths(today.year);

  // Estado
  let state = {
    monthIndex: today.month,
    day: null,
    circuit: null,
    time: null,
  };

  const pillsContainer = document.getElementById("monthPills");
  const daysContainer = document.getElementById("calendarDays");
  const timeGrid = document.getElementById("timeGrid");
  const yearSelect = document.getElementById("visitYear");
  [today.year, today.year + 1].forEach((year) => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearSelect.appendChild(option);
  });
  yearSelect.addEventListener("change", () => {
    const year = Number(yearSelect.value);
    months = makeMonths(year);
    state.monthIndex = year === today.year ? today.month : 0;
    state.day = null;
    state.circuit = null;
    state.time = null;
    renderAll();
    loadAvailability();
  });

  // ===== Referencias a pasos =====
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");
  const step2Badge = document.getElementById("step2Badge");
  const step3Badge = document.getElementById("step3Badge");

  // ===== Píldoras de mes =====
  function renderPills() {
    pillsContainer.innerHTML = "";
    months.forEach((m, i) => {
      const btn = document.createElement("button");
      const isActive = i === state.monthIndex;
      const isPast =
        m.year < today.year || (m.year === today.year && m.month < today.month);
      btn.type = "button";
      btn.disabled = isPast;
      btn.setAttribute("aria-pressed", String(isActive));
      btn.setAttribute(
        "aria-label",
        `${m.name}${isPast ? `: ${translate("mes pasado")}` : ""}`,
      );
      btn.textContent = m.label;
      btn.className = `min-h-8 rounded-md px-1.5 py-2 text-xs font-medium transition ${
        isPast
          ? "cursor-not-allowed text-gray-300"
          : isActive
            ? "text-white bg-[#B71532] font-semibold shadow-sm"
            : "text-gray-700 bg-white hover:bg-[#fbeaed] hover:text-[#B71532]"
      }`;
      btn.onclick = () => {
        state.monthIndex = i;
        state.day = null;
        state.circuit = null;
        state.time = null;
        renderAll();
        loadAvailability();
      };
      pillsContainer.appendChild(btn);
    });
  }

  // ===== Calendario =====
  function renderCalendar() {
    const { year, month } = months[state.monthIndex];
    daysContainer.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const offset = (firstDay + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    for (let i = offset - 1; i >= 0; i--) {
      const cell = document.createElement("div");
      cell.className =
        "py-3 text-gray-300 bg-gray-50/50 border-r border-gray-50";
      cell.textContent = daysInPrevMonth - i;
      daysContainer.appendChild(cell);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.setAttribute("aria-label", `${d} ${months[state.monthIndex].name}`);
      cell.setAttribute("aria-pressed", String(state.day === d));
      const isSelected = state.day === d;
      const isPast =
        year < today.year ||
        (year === today.year &&
          (month < today.month || (month === today.month && d < today.day)));
      if (isPast)
        cell.setAttribute(
          "aria-label",
          `${d} ${months[state.monthIndex].name}: ${translate("fecha pasada")}`,
        );
      cell.className = `day-cell min-w-0 rounded-lg py-2.5 transition-colors duration-150 motion-safe:[&:enabled:hover_.day-number]:-translate-y-1 motion-safe:[&:enabled:hover_.cupos]:-translate-y-1 disabled:cursor-not-allowed ${isSelected ? "selected ring-2 ring-inset ring-[#007020]" : "enabled:hover:brightness-95 enabled:hover:cursor-pointer"} ${isPast ? "past bg-gray-50 opacity-40" : ""}`;

      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const cupos =
        loadState === "ready" ? availability.dates[dateKey] : undefined;

      const cuposState =
        cupos === undefined
          ? "bg-gray-100 text-gray-400"
          : cupos === 0
            ? "empty bg-[#fbeaed] text-[#b71532]"
            : cupos < 10
              ? "low bg-[#fff0db] text-[#b45309]"
              : "available bg-[#e6f2e8] text-[#007020]";
      if (!isPast) cell.className += ` ${cuposState}`;
      if (!isPast && cupos === 0) cell.classList.add("sold-out");
      if (!isPast)
        cell.setAttribute(
          "aria-label",
          `${d} ${months[state.monthIndex].name}: ${cupos === undefined ? translate("Sin datos") : cupos === 0 ? translate("Agotado") : `${cupos} ${translate("cupos")}, ${cupos < 10 ? translate("Últimos cupos") : translate("disponibles")}`}`,
        );

      cell.innerHTML = `
          <span class="day-number block motion-safe:transition-transform motion-safe:duration-200 ${isSelected ? "text-[#007020] font-bold" : !isPast && cupos === 0 ? "text-[#b71532] font-medium" : "text-gray-700 font-medium"}">${d}</span>
          ${isPast ? '<span class="block text-xs text-gray-400 mt-1">—</span>' : `<span class="cupos motion-safe:transition-transform motion-safe:duration-200 inline-flex flex-col items-center min-w-9 mt-1 px-1.5 py-[3px] rounded-md leading-[1.1] ${cuposState}"><strong class="text-lg font-extrabold tabular-nums">${cupos ?? "\u2014"}</strong><small class="text-[8px] font-semibold mt-0.5">${cupos === undefined ? translate("Sin datos") : cupos === 0 ? translate("Agotado") : translate("cupos")}</small></span>`}
        `;

      if (cupos > 0 && !isPast) {
        cell.onclick = () => {
          state.day = d;
          state.circuit = document.getElementById("circuitSelect").value;
          state.time = null;
          renderAll();
        };
      } else {
        cell.classList.add("disabled");
        cell.disabled = true;
      }
      daysContainer.appendChild(cell);
    }

    const totalCells = offset + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const cell = document.createElement("div");
      cell.className =
        "py-3 border-t border-l border-gray-50 text-gray-300 bg-gray-50/50";
      cell.textContent = i;
      daysContainer.appendChild(cell);
    }
  }

  // ===== Horarios =====
  function renderTimes() {
    timeGrid.innerHTML = "";
    const m = months[state.monthIndex];
    const dateKey = `${m.year}-${String(m.month + 1).padStart(2, "0")}-${String(state.day).padStart(2, "0")}`;
    Object.keys(availability.times)
      .sort()
      .forEach((t) => {
        const count = availability.times[t][dateKey];
        const isUnavailable = loadState !== "ready" || !count;
        const isSelected = state.time === t;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.disabled = isUnavailable || !state.day || !state.circuit;
        btn.setAttribute("aria-pressed", String(isSelected));
        btn.textContent = `${t} \u00b7 ${count ?? "\u2014"} ${translate("cupos")}`;
        btn.className = `py-2.5 rounded-lg text-sm font-semibold border transition ${
          isUnavailable
            ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
            : isSelected
              ? "border-[#007020] bg-[#007020] text-white shadow-sm"
              : "border-gray-200 bg-white text-gray-700 hover:border-[#007020] hover:text-[#007020]"
        }`;
        if (!isUnavailable) {
          btn.onclick = () => {
            state.time = t;
            renderAll();
          };
        }
        timeGrid.appendChild(btn);
      });
  }

  // ===== Resumen lateral =====
  function renderSummary() {
    const circuit = document.getElementById("circuitSelect").value;
    document.getElementById("circuitGroup").textContent =
      translate("Circuito") + " " + circuit[0];
    document.getElementById("circuitRoute").textContent =
      translate("Ruta") + " " + circuit;
    const m = months[state.monthIndex];
    const setVal = (id, val, active) => {
      const el = document.getElementById(id);
      el.textContent = val || "—";
      el.className = `font-semibold text-right ${active ? "text-gray-900" : "text-gray-400"}`;
    };
    setVal("sumMonth", m.name, true);
    setVal(
      "sumDate",
      state.day ? `${state.day} ${m.name.split(" ")[0]}` : null,
      !!state.day,
    );
    setVal(
      "sumCircuit",
      state.circuit
        ? document.querySelector(
            `#circuitSelect option[value="${state.circuit}"]`,
          ).textContent
        : null,
      !!state.circuit,
    );
    setVal("sumTime", state.time, !!state.time);

    const ready = state.day && state.circuit && state.time;
    const btn = document.getElementById("payBtn");
    if (ready) {
      btn.disabled = false;
      btn.className =
        "w-full bg-[#B71532] hover:bg-[#8f1028] text-white font-bold py-3.5 rounded-xl shadow-md shadow-[#B71532]/20 transition transform hover:-translate-y-0.5 cursor-pointer";
    } else {
      btn.disabled = true;
      btn.className =
        "w-full bg-gray-300 text-white font-bold py-3.5 rounded-xl transition cursor-not-allowed";
    }
  }

  // ===== Activar/desactivar pasos según progreso =====
  function renderSteps() {
    document.getElementById("circuitSelect").disabled = false;
    step2.classList.remove("opacity-50", "pointer-events-none");
    step2Badge.className =
      "w-8 h-8 rounded-full bg-[#007020] text-white flex items-center justify-center font-bold text-sm shadow-sm";

    // Paso 3 se activa cuando hay circuito seleccionado
    if (state.day && state.circuit) {
      step3.classList.remove("opacity-50", "pointer-events-none");
      step3Badge.className =
        "w-8 h-8 rounded-full bg-[#007020] text-white flex items-center justify-center font-bold text-sm shadow-sm";
    } else {
      step3.classList.add("opacity-50", "pointer-events-none");
      step3Badge.className =
        "w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm";
    }
  }

  // ===== Render global =====
  function renderAll() {
    renderPills();
    renderCalendar();
    renderSteps();
    renderTimes();
    renderSummary();
  }

  // ===== Selector de circuito =====
  document.getElementById("circuitSelect").addEventListener("change", (e) => {
    state.circuit = e.target.value;
    document.getElementById("circuitGroup").textContent =
      translate("Circuito") + " " + state.circuit[0];
    document.getElementById("circuitRoute").textContent =
      translate("Ruta") + " " + state.circuit;
    document.getElementById("previewStatus").textContent = "";
    state.day = null;
    state.time = null;
    renderAll();
    loadAvailability();
  });

  document.getElementById("payBtn").addEventListener("click", () => {
    const month = months[state.monthIndex];
    const selection = {
      date: `${month.year}-${String(month.month + 1).padStart(2, "0")}-${String(state.day).padStart(2, "0")}`,
      route: state.circuit,
      time: state.time,
    };
    try {
      sessionStorage.setItem("machuPicchuSelection", JSON.stringify(selection));
      sessionStorage.setItem("machuPicchuRequestId", requestId);
      window.location.href = "/es/pre-reserva-machu-picchu/";
    } catch {
      document.getElementById("previewStatus").textContent = translate(
        "No pudimos guardar tu selección. Habilita el almacenamiento del navegador para continuar.",
      );
    }
  });

  async function loadAvailability() {
    requestController?.abort();
    state.day = null;
    state.time = null;
    const controller = new AbortController();
    requestController = controller;
    const m = months[state.monthIndex];
    const route = MACHU_PICCHU_ROUTES.find(
      (r) => r.code === circuitSelect.value,
    );
    availability = { dates: {}, times: {} };
    loadState = "loading";
    const status = document.getElementById("availabilityStatus");
    status.textContent = translate("Consultando disponibilidad...");
    renderAll();
    try {
      const result = await fetchCalendarAvailability({
        place: MACHU_PICCHU_PLACE_ID,
        road: route.road,
        year: m.year,
        month: m.month + 1,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      availability = result;
      loadState = "ready";
      status.textContent = Object.keys(availability.dates).length
        ? `${translate("Cupos por fecha para Ruta")} ${route.code}. ${translate("Selecciona otra ruta para comparar.")}`
        : translate("No hay datos publicados para este mes y ruta.");
    } catch {
      if (controller.signal.aborted) return;
      loadState = "error";
      status.textContent = translate(
        "No pudimos consultar los cupos. Intenta de nuevo o cambia el mes.",
      );
    }
    renderAll();
  }
  document.getElementById("retryAvailability").onclick = loadAvailability;
  renderAll();
  loadAvailability();
}
document.addEventListener("astro:page-load", initMachuPicchuCalendar);
initMachuPicchuCalendar();
