(() => {
  const STORAGE_KEY = 'musculacao_web_v1';
  const MAX_HISTORY = 12;
  const SHORT_HISTORY = 3;
  const MOODS = ['🤩', '😁', '😐', '😔', '🥵'];
  const DAYS = [
    ['segunda', 'Segunda'],
    ['terca', 'Terça'],
    ['quarta', 'Quarta'],
    ['quinta', 'Quinta'],
    ['sexta', 'Sexta'],
    ['sabado', 'Sábado'],
    ['domingo', 'Domingo']
  ];

  const MUSCLE_GROUPS = [
    ['biceps', 'Bíceps'],
    ['triceps', 'Tríceps'],
    ['peito', 'Peito'],
    ['costas', 'Costas'],
    ['ombro', 'Ombro'],
    ['posterior-coxa', 'Posterior de coxa'],
    ['quadriceps', 'Quadríceps'],
    ['gluteo', 'Glúteo'],
    ['panturrilha', 'Panturrilha'],
    ['abdomen', 'Abdômen'],
    ['antebraco', 'Antebraço'],
    ['outros', 'Outros']
  ];

  const MACRO_FIELDS = [
    ['kcal', '🔥', 'kcal'],
    ['protein', '🥩', 'prot'],
    ['fat', '🥑', 'gord'],
    ['carbs', '🍚', 'carb']
  ];

  const INGREDIENT_SECTIONS = [
    ['proteinas', 'Proteínas'],
    ['carboidratos', 'Carboidratos'],
    ['gorduras', 'Gorduras'],
    ['frutas', 'Frutas'],
    ['verduras-legumes', 'Verduras e legumes'],
    ['laticinios', 'Laticínios'],
    ['graos-cereais', 'Grãos e cereais'],
    ['bebidas', 'Bebidas'],
    ['suplementos', 'Suplementos'],
    ['temperos', 'Temperos'],
    ['outros', 'Outros']
  ];

  const STREAK_BADGES = [
    { days: 3, label: '3 dias', icon: '🔥', className: 'streak-tier-1' },
    { days: 7, label: '7 dias', icon: '🔥', className: 'streak-tier-2' },
    { days: 15, label: '15 dias', icon: '🔥', className: 'streak-tier-3' },
    { days: 30, label: '30 dias', icon: '🔥', className: 'streak-tier-4' },
    { days: 50, label: '50 dias+', icon: '🔥', className: 'streak-tier-5' }
  ];

  const app = document.getElementById('app');
  const pageTitle = document.getElementById('pageTitle');
  const backButton = document.getElementById('backButton');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');
  const toast = document.getElementById('toast');

  const ui = {
    historyMode: {},
    currentDate: todayISO(),
    dietDate: todayISO(),
    shoppingSort: 'section',
    draftMood: {}
  };

  let state = loadState();

  function defaultDiet() {
    return {
      meals: [],
      extraMeals: [],
      freeMealSlots: [],
      completions: {}
    };
  }

  function defaultWeightControl() {
    return {
      records: []
    };
  }

  function normalizeWeightControl(weightControl = {}) {
    return {
      records: Array.isArray(weightControl.records) ? weightControl.records : []
    };
  }

  function normalizeDiet(diet = {}) {
    return {
      meals: Array.isArray(diet.meals) ? diet.meals : [],
      extraMeals: Array.isArray(diet.extraMeals) ? diet.extraMeals : [],
      freeMealSlots: Array.isArray(diet.freeMealSlots) ? diet.freeMealSlots.slice(0, 2) : [],
      completions: diet.completions && typeof diet.completions === 'object' ? diet.completions : {}
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { workouts: [], diet: defaultDiet(), weightControl: defaultWeightControl() };
      const parsed = JSON.parse(raw);
      return {
        workouts: Array.isArray(parsed.workouts) ? parsed.workouts : [],
        diet: normalizeDiet(parsed.diet),
        weightControl: normalizeWeightControl(parsed.weightControl)
      };
    } catch (error) {
      console.error(error);
      return { workouts: [], diet: defaultDiet(), weightControl: defaultWeightControl() };
    }
  }

  function saveState() {
    state.diet = normalizeDiet(state.diet);
    state.weightControl = normalizeWeightControl(state.weightControl);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function uid(prefix = 'id') {
    if (window.crypto && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function todayISO() {
    return toISODate(new Date());
  }

  function parseISODate(isoDate) {
    const [year, month, day] = String(isoDate || todayISO()).split('-').map(Number);
    return new Date(year || 1970, (month || 1) - 1, day || 1);
  }

  function toISODate(date) {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
  }

  function addDays(isoDate, amount) {
    const date = parseISODate(isoDate);
    date.setDate(date.getDate() + amount);
    return toISODate(date);
  }

  function dayKeyFromDate(isoDate) {
    const index = parseISODate(isoDate).getDay();
    const map = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return map[index];
  }

  function dayLabel(value) {
    return DAYS.find(([key]) => key === value)?.[1] || value;
  }

  function ingredientSectionLabel(value) {
    return INGREDIENT_SECTIONS.find(([key]) => key === value)?.[1] || 'Outros';
  }

  function formatDate(isoDate) {
    if (!isoDate) return '-';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }

  function parseNumber(value) {
    const normalized = String(value ?? '').replace(',', '.');
    const number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function findWorkout(workoutId) {
    return state.workouts.find(workout => workout.id === workoutId);
  }

  function findExercise(workout, exerciseId) {
    return workout?.exercises?.find(exercise => exercise.id === exerciseId);
  }

  function findMeal(mealId) {
    return state.diet.meals.find(meal => meal.id === mealId);
  }

  function findExtraMeal(extraId) {
    return state.diet.extraMeals.find(extra => extra.id === extraId);
  }

  function findWeightRecord(recordId) {
    return state.weightControl?.records?.find(record => record.id === recordId);
  }

  function getRoute() {
    const hash = window.location.hash || '#home';
    const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    return {
      name: parts[0] || 'home',
      params: parts.slice(1)
    };
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  function scheduleText(workout) {
    if (workout.scheduleType === 'fixed') {
      const labels = DAYS
        .filter(([value]) => workout.fixedDays?.includes(value))
        .map(([, label]) => label);
      return labels.length ? labels.join(', ') : 'Dia fixo não definido';
    }
    if (workout.scheduleType === 'rotative') return 'Treino rotativo';
    return 'Sem dia fixo';
  }

  function muscleLabel(value) {
    return MUSCLE_GROUPS.find(([key]) => key === value)?.[1] || 'Sem grupo';
  }

  function muscleSummary(workout) {
    const counts = {};
    (workout.exercises || []).forEach(exercise => {
      if (!exercise.muscleGroup) return;
      counts[exercise.muscleGroup] = (counts[exercise.muscleGroup] || 0) + 1;
    });

    return MUSCLE_GROUPS
      .filter(([key]) => counts[key])
      .map(([key, label]) => ({ key, label, count: counts[key] }));
  }

  function renderMusclePills(workout) {
    const summary = muscleSummary(workout);
    if (!summary.length) return '<span class="pill muscle-pill muted">Sem grupos definidos</span>';

    return summary
      .map(item => `<span class="pill muscle-pill">${item.count} ${escapeHtml(item.label.toLowerCase())}</span>`)
      .join('');
  }

  function clearWorkoutTheme() {
    document.body.classList.remove('workout-color-page');
    document.body.style.removeProperty('--page-accent-rgb');
  }

  function applyWorkoutTheme(color) {
    document.body.style.setProperty('--page-accent-rgb', hexToRgb(color || '#38bdf8'));
    document.body.classList.add('workout-color-page');
  }

  function hexToRgb(hex) {
    const fallback = '56, 189, 248';
    const clean = String(hex || '').replace('#', '').trim();
    if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(clean)) return fallback;
    const normalized = clean.length === 3 ? clean.split('').map(char => char + char).join('') : clean;
    const int = Number.parseInt(normalized, 16);
    const red = (int >> 16) & 255;
    const green = (int >> 8) & 255;
    const blue = int & 255;
    return `${red}, ${green}, ${blue}`;
  }

  function totalExercises() {
    return state.workouts.reduce((sum, workout) => sum + (workout.exercises?.length || 0), 0);
  }

  function totalRecords() {
    return state.workouts.reduce((sum, workout) => {
      return sum + (workout.exercises || []).reduce((inner, exercise) => inner + (exercise.history?.length || 0), 0);
    }, 0);
  }

  function emptyMacros() {
    return { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  }

  function addMacros(base, item) {
    base.kcal += parseNumber(item?.kcal);
    base.protein += parseNumber(item?.protein);
    base.fat += parseNumber(item?.fat);
    base.carbs += parseNumber(item?.carbs);
    return base;
  }

  function mealMacros(meal) {
    const total = emptyMacros();
    addMacros(total, meal);
    (meal.ingredients || []).forEach(ingredient => addMacros(total, ingredient));
    return total;
  }

  function macroSummaryHtml(macros, compact = false) {
    return `
      <div class="macro-line ${compact ? 'compact' : ''}">
        ${MACRO_FIELDS.map(([key, emoji, label]) => `
          <span><b>${emoji}</b> ${formatMacro(macros[key], key)} ${label}</span>
        `).join('')}
      </div>
    `;
  }

  function formatMacro(value, key) {
    const number = Number(value || 0);
    if (key === 'kcal') return String(Math.round(number));
    return Number.isInteger(number) ? String(number) : number.toFixed(1).replace('.', ',');
  }

  function weekDates(baseIso = todayISO()) {
    const base = parseISODate(baseIso);
    const day = base.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = parseISODate(toISODate(base));
    monday.setDate(base.getDate() + diffToMonday);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return toISODate(date);
    });
  }

  function getWeeklyMacros(baseIso = todayISO()) {
    const total = emptyMacros();
    const dates = weekDates(baseIso);
    dates.forEach(date => {
      const dayKey = dayKeyFromDate(date);
      state.diet.meals.forEach(meal => {
        if ((meal.days || []).includes(dayKey)) addMacros(total, mealMacros(meal));
      });
      state.diet.extraMeals
        .filter(extra => extra.date === date)
        .forEach(extra => addMacros(total, extra));
    });
    return total;
  }

  function readDietLog(date) {
    const log = state.diet.completions?.[date];
    return {
      mealIds: Array.isArray(log?.mealIds) ? log.mealIds : [],
      extraIds: Array.isArray(log?.extraIds) ? log.extraIds : [],
      freeIds: Array.isArray(log?.freeIds) ? log.freeIds : [],
      broken: Boolean(log?.broken)
    };
  }

  function ensureDietLog(date) {
    state.diet.completions = state.diet.completions || {};
    const current = readDietLog(date);
    state.diet.completions[date] = current;
    return current;
  }

  function hasDietCompletion(date) {
    const log = readDietLog(date);
    return !log.broken && (log.mealIds.length > 0 || log.extraIds.length > 0 || log.freeIds.length > 0);
  }

  function getDietStreak() {
    const today = todayISO();
    if (readDietLog(today).broken) return 0;

    let cursor = hasDietCompletion(today) ? today : addDays(today, -1);
    let count = 0;

    while (count < 730) {
      const log = readDietLog(cursor);
      if (log.broken) break;
      if (!hasDietCompletion(cursor)) break;
      count += 1;
      cursor = addDays(cursor, -1);
    }

    return count;
  }

  function currentStreakClass(streak) {
    const current = [...STREAK_BADGES].reverse().find(badge => streak >= badge.days);
    return current?.className || 'streak-tier-0';
  }

  function streakWidgetHtml(streak, compact = false) {
    const next = STREAK_BADGES.find(badge => streak < badge.days);
    return `
      <div class="streak-widget ${compact ? 'compact' : ''}">
        <div class="streak-current">
          <span class="streak-flame ${currentStreakClass(streak)}">🔥</span>
          <div>
            <strong>${streak}</strong>
            <span>dia(s) sem furar a dieta</span>
            ${next ? `<small>Próximo selo: ${next.label}</small>` : `<small>Selo máximo ativo</small>`}
          </div>
        </div>
        <div class="streak-badge-row" aria-label="Selos de sequência">
          ${STREAK_BADGES.map(badge => {
            const active = streak >= badge.days;
            return `
              <div class="streak-badge ${active ? 'active' : ''}" title="${active ? 'Desbloqueado' : 'Bloqueado'}: ${badge.label}">
                <span class="streak-badge-icon ${badge.className}">${badge.icon}</span>
                <span>${badge.label}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function sortWeightRecords(records = []) {
    return [...records].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }

  function latestWeightRecord() {
    return sortWeightRecords(state.weightControl?.records || [])[0] || null;
  }

  function averageWeight(records = []) {
    const valid = records.filter(record => parseNumber(record.weight) > 0);
    if (!valid.length) return 0;
    const total = valid.reduce((sum, record) => sum + parseNumber(record.weight), 0);
    return total / valid.length;
  }

  function weightRecordsInWeek(baseIso = todayISO()) {
    const dates = new Set(weekDates(baseIso));
    return (state.weightControl?.records || []).filter(record => dates.has(record.date));
  }

  function weightRecordsInMonth(baseIso = todayISO()) {
    const month = String(baseIso || todayISO()).slice(0, 7);
    return (state.weightControl?.records || []).filter(record => String(record.date || '').startsWith(month));
  }

  function getWeightSummary(baseIso = todayISO()) {
    const latest = latestWeightRecord();
    return {
      latest,
      weeklyAverage: averageWeight(weightRecordsInWeek(baseIso)),
      monthlyAverage: averageWeight(weightRecordsInMonth(baseIso)),
      total: state.weightControl?.records?.length || 0
    };
  }

  function bmiForRecord(record) {
    const weight = parseNumber(record?.weight);
    const height = parseNumber(record?.height);
    if (!weight || !height) return 0;
    const meters = height > 3 ? height / 100 : height;
    if (!meters) return 0;
    return weight / (meters * meters);
  }

  function plannedWorkoutsForDate(date) {
    const dayKey = dayKeyFromDate(date);
    return state.workouts.filter(workout => workout.scheduleType === 'fixed' && (workout.fixedDays || []).includes(dayKey));
  }

  function plannedMealsForDate(date) {
    const dayKey = dayKeyFromDate(date);
    return state.diet.meals.filter(meal => (meal.days || []).includes(dayKey));
  }

  function freeMealsForDate(date) {
    const dayKey = dayKeyFromDate(date);
    return state.diet.freeMealSlots.filter(slot => slot.day === dayKey);
  }

  function extrasForDate(date) {
    return state.diet.extraMeals.filter(extra => extra.date === date);
  }

  function collectShoppingItems() {
    const items = new Map();

    state.diet.meals.forEach(meal => {
      (meal.ingredients || []).forEach(ingredient => {
        const name = String(ingredient.name || '').trim();
        if (!name) return;
        const section = ingredient.section || 'outros';
        const key = `${section}::${name.toLowerCase()}`;
        const current = items.get(key) || {
          name,
          section,
          count: 0,
          meals: new Set(),
          kcal: 0,
          protein: 0,
          fat: 0,
          carbs: 0
        };
        current.count += 1;
        current.meals.add(meal.name);
        addMacros(current, ingredient);
        items.set(key, current);
      });
    });

    return [...items.values()].map(item => ({
      ...item,
      meals: [...item.meals].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    }));
  }

  function shoppingItemsByMode(mode = 'section') {
    const items = collectShoppingItems();
    if (mode === 'alpha') {
      return items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }

    return items.sort((a, b) => {
      const sectionCompare = ingredientSectionLabel(a.section).localeCompare(ingredientSectionLabel(b.section), 'pt-BR');
      if (sectionCompare !== 0) return sectionCompare;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }

  function bmiCategory(imc) {
    const bmi = Number(imc || 0);
    if (!bmi) return '-';
    if (bmi < 18.5) return 'Abaixo do peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    if (bmi < 35) return 'Obesidade grau I';
    if (bmi < 40) return 'Obesidade grau II';
    return 'Obesidade grau III';
  }

  function isItemCompleted(date, type, id) {
    const log = readDietLog(date);
    if (type === 'meal') return log.mealIds.includes(id);
    if (type === 'extra') return log.extraIds.includes(id);
    if (type === 'free') return log.freeIds.includes(id);
    return false;
  }

  function toggleCompletion(date, type, id) {
    const log = ensureDietLog(date);
    const key = type === 'meal' ? 'mealIds' : type === 'extra' ? 'extraIds' : 'freeIds';
    const exists = log[key].includes(id);
    log[key] = exists ? log[key].filter(item => item !== id) : [...log[key], id];
    if (!exists && log.broken) log.broken = false;
    state.diet.completions[date] = log;
    saveState();
    showToast(exists ? 'Conclusão removida.' : 'Refeição concluída.');
    render();
  }

  function render() {
    const route = getRoute();
    backButton.hidden = route.name === 'home';

    if (route.name === 'workouts') {
      renderWorkouts();
      return;
    }

    if (route.name === 'workout') {
      renderWorkout(route.params[0]);
      return;
    }

    if (route.name === 'diet') {
      renderDiet();
      return;
    }

    if (route.name === 'weight') {
      renderWeightControl();
      return;
    }

    renderHome();
  }

  function renderHome() {
    clearWorkoutTheme();
    pageTitle.textContent = 'Treino Web';
    const today = todayISO();
    const todayDay = dayKeyFromDate(today);
    const todayWorkouts = plannedWorkoutsForDate(today);
    const todayMeals = plannedMealsForDate(today);
    const todayFreeSlots = freeMealsForDate(today);
    const todayExtras = extrasForDate(today);
    const weekly = getWeeklyMacros();
    const streak = getDietStreak();
    const weightSummary = getWeightSummary();

    app.innerHTML = `
      <section class="home-intro">
        <img src="assets/icon.svg" alt="" class="app-logo-large" />
        <div>
          <h2>Treino Web</h2>
          <p>Controle simples para treinos, dieta e evolução, pensado primeiro para mobile.</p>
        </div>
      </section>

      <section class="grid-home">
        <button class="home-card active" data-action="go-workouts">
          <div>
            <strong>Treinos</strong>
            <span>Cadastro, exercícios, séries e histórico.</span>
          </div>
          <span class="home-icon">🏋️</span>
        </button>

        <button class="home-card active diet-card-home" data-action="go-diet" type="button">
          <div>
            <strong>Dieta</strong>
            <span>Refeições, ingredientes, macros e sequência.</span>
          </div>
          <span class="home-icon">🥗</span>
        </button>

        <button class="home-card active weight-card-home" data-action="go-weight" type="button">
          <div>
            <strong>Controle de peso</strong>
            <span>Peso, altura, BF e médias de evolução.</span>
          </div>
          <span class="home-icon">⚖️</span>
        </button>
      </section>

      <section class="today-grid" aria-label="Planejamento de hoje">
        <article class="stat-card today-card">
          <div class="section-title-row compact">
            <h2>Treinos previstos hoje</h2>
            <span class="pill">${escapeHtml(dayLabel(todayDay))}</span>
          </div>
          ${todayWorkouts.length ? `
            <div class="today-list">
              ${todayWorkouts.map(workout => `
                <button class="today-item" type="button" data-action="open-workout" data-workout-id="${workout.id}">
                  <span class="color-dot tiny" style="--accent: ${escapeHtml(workout.color || '#38bdf8')}"></span>
                  <strong>${escapeHtml(workout.name)}</strong>
                  <small>${workout.exercises?.length || 0} exercício(s)</small>
                </button>
              `).join('')}
            </div>
          ` : `<p class="small-muted">Nenhum treino com dia fixo marcado para hoje.</p>`}
        </article>

        <article class="stat-card today-card">
          <div class="section-title-row compact">
            <h2>Refeições previstas hoje</h2>
            <span class="pill">${todayMeals.length + todayFreeSlots.length + todayExtras.length} item(ns)</span>
          </div>
          ${todayMeals.length || todayFreeSlots.length || todayExtras.length ? `
            <div class="today-list">
              ${todayMeals.map(meal => `
                <button class="today-item" type="button" data-action="go-diet">
                  <span>🥗</span>
                  <strong>${escapeHtml(meal.name)}</strong>
                  <small>${formatMacro(mealMacros(meal).kcal, 'kcal')} kcal</small>
                </button>
              `).join('')}
              ${todayFreeSlots.map(slot => `
                <button class="today-item" type="button" data-action="go-diet">
                  <span>🍽️</span>
                  <strong>${escapeHtml(slot.name || 'Refeição livre')}</strong>
                  <small>livre planejada</small>
                </button>
              `).join('')}
              ${todayExtras.map(extra => `
                <button class="today-item" type="button" data-action="go-diet">
                  <span>➕</span>
                  <strong>${escapeHtml(extra.name)}</strong>
                  <small>fora do padrão</small>
                </button>
              `).join('')}
            </div>
          ` : `<p class="small-muted">Nenhuma refeição cadastrada para hoje.</p>`}
        </article>
      </section>

      <section class="stats-grid" aria-label="Resumo">
        <div class="stat-card summary-stat">
          <strong>Cadastros</strong>
          <div class="summary-lines">
            <span>🏋️ ${state.workouts.length} treino(s)</span>
            <span>🥗 ${state.diet.meals.length} refeição(ões)</span>
            <span>💪 ${totalExercises()} exercício(s)</span>
          </div>
        </div>
        <div class="stat-card macro-stat">
          <strong>${formatMacro(weekly.kcal, 'kcal')} kcal</strong>
          <span>macros semanais</span>
          ${macroSummaryHtml(weekly, true)}
        </div>
        <div class="stat-card weight-stat">
          <strong>${weightSummary.latest ? `${formatNumber(weightSummary.latest.weight)} kg` : '-'}</strong>
          <span>peso atual</span>
          <div class="weight-mini-line">
            <small>Semana: ${weightSummary.weeklyAverage ? `${formatNumber(weightSummary.weeklyAverage)} kg` : '-'}</small>
            <small>Mês: ${weightSummary.monthlyAverage ? `${formatNumber(weightSummary.monthlyAverage)} kg` : '-'}</small>
          </div>
        </div>
      </section>

      ${streakWidgetHtml(streak)}

      <button class="data-float-button" type="button" data-action="open-data-tools">JSON</button>
    `;
  }

  function renderWorkouts() {
    clearWorkoutTheme();
    pageTitle.textContent = 'Treinos';
    const cards = state.workouts.map(workout => `
      <article class="card" style="--accent: ${escapeHtml(workout.color || '#38bdf8')}">
        <div class="card-header">
          <div>
            <h2 class="card-title">${escapeHtml(workout.name)}</h2>
            <div class="meta-list">
              <span class="pill">${escapeHtml(scheduleText(workout))}</span>
              <span class="pill">${workout.exercises?.length || 0} exercício(s)</span>
            </div>
            <div class="tag-list">${renderMusclePills(workout)}</div>
          </div>
          <div class="action-menu">
            <button class="mini-button" data-action="edit-workout" data-workout-id="${workout.id}" title="Editar treino">✎</button>
            <button class="mini-button" data-action="delete-workout" data-workout-id="${workout.id}" title="Excluir treino">🗑</button>
          </div>
        </div>
        <p class="small-muted">${escapeHtml(workout.notes || 'Sem observações.')}</p>
        <div class="toolbar-row" style="margin-top: 14px;">
          <button class="secondary-button" data-action="open-workout" data-workout-id="${workout.id}">Abrir treino</button>
        </div>
      </article>
    `).join('');

    app.innerHTML = `
      <section class="toolbar">
        <div class="toolbar-row">
          <div class="toolbar-text">
            <h2>Meus treinos</h2>
            <p>Cadastre seus próprios treinos. Nenhum treino é criado automaticamente.</p>
          </div>
          <button class="primary-button" data-action="new-workout">+ Novo treino</button>
        </div>
      </section>

      ${state.workouts.length ? `<section class="card-grid">${cards}</section>` : `
        <section class="empty-state">
          <h2>Nenhum treino cadastrado</h2>
          <p>Crie o primeiro treino para adicionar exercícios, séries e histórico.</p>
          <div style="margin-top: 16px;">
            <button class="primary-button" data-action="new-workout">Criar primeiro treino</button>
          </div>
        </section>
      `}
    `;
  }

  function renderWorkout(workoutId) {
    const workout = findWorkout(workoutId);
    if (!workout) {
      navigate('#workouts');
      return;
    }

    applyWorkoutTheme(workout.color || '#38bdf8');
    pageTitle.textContent = workout.name;
    const exercises = workout.exercises || [];
    app.innerHTML = `
      <section class="workout-hero" style="--accent: ${escapeHtml(workout.color || '#38bdf8')}">
        <div class="workout-hero-main">
          <div>
            <div class="hero-title-row">
              <span class="color-dot"></span>
              <h2>${escapeHtml(workout.name)}</h2>
            </div>
            <div class="meta-list" style="margin-top: 12px;">
              <span class="pill">${escapeHtml(scheduleText(workout))}</span>
              <span class="pill">${exercises.length} exercício(s)</span>
            </div>
            <div class="tag-list">${renderMusclePills(workout)}</div>
            <p class="small-muted">${escapeHtml(workout.notes || 'Sem observações.')}</p>
            <div class="toolbar-row" style="margin-top: 14px;">
              <button class="secondary-button" data-action="edit-workout" data-workout-id="${workout.id}">Editar treino</button>
              <button class="danger-button" data-action="delete-workout" data-workout-id="${workout.id}">Excluir</button>
            </div>
          </div>
          <div class="date-panel">
            <label for="recordDate">Data do registro</label>
            <input id="recordDate" type="date" value="${escapeHtml(ui.currentDate)}" data-action="change-record-date" />
            <p class="small-muted">Cada exercício salva um registro por dia. O histórico guarda até ${MAX_HISTORY} registros.</p>
          </div>
        </div>
      </section>

      <section class="toolbar">
        <div class="toolbar-row">
          <div class="toolbar-text">
            <h2>Exercícios</h2>
            <p>Edite exercícios e séries livremente. O histórico fica oculto até você abrir.</p>
          </div>
          <button class="primary-button" data-action="new-exercise" data-workout-id="${workout.id}">+ Exercício</button>
        </div>
      </section>

      ${exercises.length ? `<section class="exercise-grid">${exercises.map(exercise => renderExerciseCard(workout, exercise)).join('')}</section>` : `
        <section class="empty-state">
          <h2>Nenhum exercício cadastrado</h2>
          <p>Adicione o primeiro exercício deste treino.</p>
          <div style="margin-top: 16px;">
            <button class="primary-button" data-action="new-exercise" data-workout-id="${workout.id}">Adicionar exercício</button>
          </div>
        </section>
      `}
    `;
  }

  function renderExerciseCard(workout, exercise) {
    const sets = Array.isArray(exercise.sets) && exercise.sets.length ? exercise.sets : [{ id: uid('set'), defaultWeight: 0, defaultReps: 0 }];
    const history = sortHistory(exercise.history || []);
    const historyMode = ui.historyMode[exercise.id] || 'hidden';
    const showHistory = historyMode !== 'hidden';
    const visibleHistory = historyMode === 'full' ? history : history.slice(0, SHORT_HISTORY);
    const selectedMood = ui.draftMood[exercise.id] || '';
    const muscle = muscleLabel(exercise.muscleGroup);

    return `
      <article class="exercise-card" data-exercise-card="${exercise.id}">
        <div class="exercise-header">
          <div>
            <h3>${escapeHtml(exercise.name)}</h3>
            <div class="exercise-tag-row">
              <span class="exercise-subtitle">${sets.length} série(s)</span>
              <span class="pill muscle-pill compact">${escapeHtml(muscle)}</span>
            </div>
          </div>
          <div class="mood-strip" aria-label="Sensação do dia">
            ${MOODS.map(mood => `
              <button class="mood-button ${selectedMood === mood ? 'active' : ''}" data-action="choose-mood" data-exercise-id="${exercise.id}" data-mood="${mood}" type="button">${mood}</button>
            `).join('')}
          </div>
        </div>

        <div class="set-table">
          ${sets.map((set, index) => `
            <div class="set-row">
              <span class="set-label">S${index + 1}</span>
              <label class="unit-input">
                <input type="number" min="0" step="0.5" inputmode="decimal" data-set-weight="${set.id}" value="${escapeHtml(set.defaultWeight ?? 0)}" aria-label="Carga da série ${index + 1}" placeholder="Carga" />
                <span>kg</span>
              </label>
              <label class="unit-input">
                <input type="number" min="0" step="1" inputmode="numeric" data-set-reps="${set.id}" value="${escapeHtml(set.defaultReps ?? 0)}" aria-label="Repetições da série ${index + 1}" placeholder="Repetições" />
                <span>reps</span>
              </label>
            </div>
          `).join('')}
        </div>

        <div class="exercise-footer">
          <div class="action-menu">
            <button class="secondary-button" data-action="save-exercise-record" data-workout-id="${workout.id}" data-exercise-id="${exercise.id}">Salvar registro</button>
          </div>
          <div class="action-menu">
            <button class="mini-button" data-action="edit-exercise" data-workout-id="${workout.id}" data-exercise-id="${exercise.id}" title="Editar exercício">✎</button>
            <button class="mini-button" data-action="delete-exercise" data-workout-id="${workout.id}" data-exercise-id="${exercise.id}" title="Excluir exercício">🗑</button>
          </div>
        </div>

        <div class="history-box ${showHistory ? 'open' : 'closed'}">
          <div class="history-title-row">
            <button class="history-toggle" data-action="${showHistory ? 'hide-history' : 'show-history'}" data-exercise-id="${exercise.id}" type="button">
              Histórico ${showHistory ? '⌃' : '⌄'}
            </button>
            ${showHistory && history.length > SHORT_HISTORY ? `
              <button class="ghost-button compact-button" data-action="${historyMode === 'full' ? 'show-short-history' : 'show-full-history'}" data-exercise-id="${exercise.id}" type="button">
                ${historyMode === 'full' ? 'Ver menos ⌃' : 'Ver todos ⌄'}
              </button>
            ` : ''}
          </div>
          ${showHistory ? (visibleHistory.length ? `<div class="history-list">${visibleHistory.map(record => renderHistoryRecord(exercise, record)).join('')}</div>` : `<p class="no-history">Nenhum registro salvo ainda.</p>`) : ''}
        </div>
      </article>
    `;
  }

  function renderHistoryRecord(exercise, record) {
    const previous = getPreviousRecord(exercise, record);
    const performedSets = (record.sets || []).filter(set => Number(set.weight || 0) > 0 || Number(set.reps || 0) > 0);

    return `
      <div class="history-item">
        <div class="history-item-header">
          <span>${formatDate(record.date)}</span>
          <span>${record.mood || 'Sem sensação'}</span>
        </div>
        ${performedSets.map((set, index) => {
          const previousSet = previous?.sets?.find(item => item.setId === set.setId);
          const progression = getProgression(set, previousSet);
          const setNumber = set.setNumber || index + 1;
          return `
            <div class="history-set-row">
              <span class="set-label">S${setNumber}</span>
              <span>${formatNumber(set.weight)} kg × ${formatNumber(set.reps)} reps</span>
              <span class="progression-text"><span class="progression-dot ${progression.className}" title="${escapeHtml(progression.label)}"></span> ${escapeHtml(progression.short)}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderDiet() {
    clearWorkoutTheme();
    state.diet = normalizeDiet(state.diet);
    pageTitle.textContent = 'Dieta';

    const date = ui.dietDate || todayISO();
    const selectedDay = dayKeyFromDate(date);
    const dayMeals = plannedMealsForDate(date);
    const freeSlots = freeMealsForDate(date);
    const extras = extrasForDate(date);
    const weekly = getWeeklyMacros(date);
    const streak = getDietStreak();
    const log = readDietLog(date);

    app.innerHTML = `
      <section class="diet-hero">
        <div class="workout-hero-main">
          <div>
            <div class="hero-title-row">
              <span class="diet-hero-icon">🥗</span>
              <h2>Dieta</h2>
            </div>
            <p class="small-muted">Cadastre refeições, ingredientes, dias de aplicação e controle suas conclusões diárias.</p>
            <div class="diet-mini-stats">
              <span class="pill">${state.diet.meals.length} refeição(ões)</span>
              <span class="pill">${state.diet.freeMealSlots.length} livre(s)/semana</span>
              <span class="pill">${streak} dia(s) sem furar</span>
            </div>
            ${streakWidgetHtml(streak, true)}
            ${macroSummaryHtml(weekly)}
          </div>
          <div class="date-panel">
            <label for="dietDate">Data da dieta</label>
            <input id="dietDate" type="date" value="${escapeHtml(date)}" data-action="change-diet-date" />
            <p class="small-muted">${escapeHtml(dayLabel(selectedDay))}. As refeições aparecem conforme os dias marcados no cadastro.</p>
          </div>
        </div>
      </section>

      <section class="toolbar">
        <div class="toolbar-row">
          <div class="toolbar-text">
            <h2>Controle da dieta</h2>
            <p>Marque as refeições concluídas. O botão de furo reseta a sequência do dia.</p>
          </div>
          <button class="primary-button" data-action="new-meal">+ Refeição</button>
          <button class="secondary-button" data-action="new-extra-meal">+ Fora do padrão</button>
          <button class="secondary-button" data-action="configure-free-meals">Refeições livres</button>
          <button class="secondary-button" data-action="toggle-shopping-sort">Lista de compras</button>
          <button class="danger-button" data-action="toggle-diet-break">${log.broken ? 'Desfazer furo' : 'Furei dieta'}</button>
        </div>
      </section>

      ${log.broken ? `<section class="broken-warning">Dia marcado como furo de dieta. A sequência foi resetada para essa data.</section>` : ''}

      <section class="section-block">
        <div class="section-title-row">
          <h2>Refeições de ${escapeHtml(dayLabel(selectedDay))}</h2>
          <span class="pill">${dayMeals.length + freeSlots.length + extras.length} item(ns)</span>
        </div>
        ${dayMeals.length || freeSlots.length || extras.length ? `
          <div class="meal-grid">
            ${dayMeals.map(meal => renderDailyMealCard(meal, date)).join('')}
            ${freeSlots.map((slot, index) => renderFreeMealCard(slot, date, index)).join('')}
            ${extras.map(extra => renderExtraMealCard(extra, date)).join('')}
          </div>
        ` : `
          <section class="empty-state slim">
            <h2>Nenhuma refeição para este dia</h2>
            <p>Cadastre uma refeição e marque o dia da semana correspondente.</p>
          </section>
        `}
      </section>

      <section class="section-block">
        <div class="section-title-row">
          <div>
            <h2>Lista de compras</h2>
            <p class="small-muted">Baseada nos ingredientes cadastrados nas refeições da dieta.</p>
          </div>
          <label class="select-inline">
            <span>Organizar</span>
            <select data-action="change-shopping-sort">
              <option value="section" ${ui.shoppingSort === 'section' ? 'selected' : ''}>por seção</option>
              <option value="alpha" ${ui.shoppingSort === 'alpha' ? 'selected' : ''}>A-Z</option>
            </select>
          </label>
        </div>
        ${renderShoppingList(ui.shoppingSort)}
      </section>

      <section class="section-block">
        <div class="section-title-row">
          <h2>Refeições cadastradas</h2>
          <button class="primary-button" data-action="new-meal">+ Nova</button>
        </div>
        ${state.diet.meals.length ? `<div class="meal-grid">${state.diet.meals.map(renderRegisteredMealCard).join('')}</div>` : `
          <section class="empty-state slim">
            <h2>Nenhuma refeição cadastrada</h2>
            <p>Comece cadastrando café da manhã, almoço, lanche, jantar ou qualquer refeição da sua rotina.</p>
          </section>
        `}
      </section>
    `;
  }

  function renderDailyMealCard(meal, date) {
    const macros = mealMacros(meal);
    const completed = isItemCompleted(date, 'meal', meal.id);
    return `
      <article class="meal-card ${completed ? 'completed' : ''}">
        <div class="meal-card-header">
          <div>
            <h3>${escapeHtml(meal.name)}</h3>
            <div class="day-list">${renderDayPills(meal.days || [])}</div>
          </div>
          <button class="check-button ${completed ? 'active' : ''}" data-action="toggle-meal-completion" data-date="${date}" data-meal-id="${meal.id}" type="button">
            ${completed ? '✓ Concluída' : 'Concluir'}
          </button>
        </div>
        ${macroSummaryHtml(macros)}
        ${renderIngredientList(meal.ingredients || [])}
        <div class="meal-actions">
          <button class="mini-button" data-action="edit-meal" data-meal-id="${meal.id}" title="Editar refeição">✎</button>
          <button class="mini-button" data-action="delete-meal" data-meal-id="${meal.id}" title="Excluir refeição">🗑</button>
        </div>
      </article>
    `;
  }

  function renderFreeMealCard(slot, date, index) {
    const completed = isItemCompleted(date, 'free', slot.id);
    return `
      <article class="meal-card free-meal-card ${completed ? 'completed' : ''}">
        <div class="meal-card-header">
          <div>
            <h3>🍽️ ${escapeHtml(slot.name || `Refeição livre ${index + 1}`)}</h3>
            <div class="day-list"><span class="pill free-pill">${escapeHtml(dayLabel(slot.day))}</span></div>
          </div>
          <button class="check-button ${completed ? 'active' : ''}" data-action="toggle-free-completion" data-date="${date}" data-free-id="${slot.id}" type="button">
            ${completed ? '✓ Concluída' : 'Concluir'}
          </button>
        </div>
        <p class="small-muted">Refeição livre planejada para este dia. Para registrar macros dela, use “Fora do padrão”.</p>
      </article>
    `;
  }

  function renderExtraMealCard(extra, date) {
    const completed = isItemCompleted(date, 'extra', extra.id);
    return `
      <article class="meal-card extra-meal-card ${completed ? 'completed' : ''}">
        <div class="meal-card-header">
          <div>
            <h3>➕ ${escapeHtml(extra.name)}</h3>
            <p class="small-muted">Fora do padrão • ${formatDate(extra.date)}</p>
          </div>
          <button class="check-button ${completed ? 'active' : ''}" data-action="toggle-extra-completion" data-date="${date}" data-extra-id="${extra.id}" type="button">
            ${completed ? '✓ Concluída' : 'Concluir'}
          </button>
        </div>
        ${macroSummaryHtml(extra)}
        ${extra.note ? `<p class="small-muted">${escapeHtml(extra.note)}</p>` : ''}
        <div class="meal-actions">
          <button class="mini-button" data-action="delete-extra-meal" data-extra-id="${extra.id}" title="Excluir refeição avulsa">🗑</button>
        </div>
      </article>
    `;
  }

  function renderRegisteredMealCard(meal) {
    const macros = mealMacros(meal);
    return `
      <article class="meal-card compact-card">
        <div class="meal-card-header">
          <div>
            <h3>${escapeHtml(meal.name)}</h3>
            <div class="day-list">${renderDayPills(meal.days || [])}</div>
          </div>
          <div class="meal-actions visible">
            <button class="mini-button" data-action="edit-meal" data-meal-id="${meal.id}" title="Editar refeição">✎</button>
            <button class="mini-button" data-action="delete-meal" data-meal-id="${meal.id}" title="Excluir refeição">🗑</button>
          </div>
        </div>
        ${macroSummaryHtml(macros, true)}
        <p class="small-muted">${(meal.ingredients || []).length} ingrediente(s)</p>
      </article>
    `;
  }

  function renderDayPills(days) {
    if (!days.length) return '<span class="pill muted">Sem dia definido</span>';
    return days.map(day => `<span class="pill day-pill">${escapeHtml(dayLabel(day))}</span>`).join('');
  }

  function renderIngredientList(ingredients) {
    if (!ingredients.length) return '<p class="small-muted">Sem ingredientes cadastrados.</p>';
    return `
      <details class="ingredient-details">
        <summary>${ingredients.length} ingrediente(s)</summary>
        <div class="ingredient-list">
          ${ingredients.map(ingredient => `
            <div class="ingredient-item">
              <strong>${escapeHtml(ingredient.name)}</strong>
              ${macroSummaryHtml(ingredient, true)}
            </div>
          `).join('')}
        </div>
      </details>
    `;
  }

  function renderShoppingList(mode = 'section') {
    const items = shoppingItemsByMode(mode);
    if (!items.length) {
      return `
        <section class="empty-state slim">
          <h2>Lista vazia</h2>
          <p>Adicione ingredientes dentro das refeições para gerar a lista de compras.</p>
        </section>
      `;
    }

    if (mode === 'alpha') {
      return `<div class="shopping-list">${items.map(renderShoppingItem).join('')}</div>`;
    }

    const groups = new Map();
    items.forEach(item => {
      const label = ingredientSectionLabel(item.section);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(item);
    });

    return `
      <div class="shopping-section-list">
        ${[...groups.entries()].map(([section, sectionItems]) => `
          <div class="shopping-section">
            <h3>${escapeHtml(section)}</h3>
            <div class="shopping-list">${sectionItems.map(renderShoppingItem).join('')}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderShoppingItem(item) {
    return `
      <div class="shopping-item">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <small>${item.count} ocorrência(s) • ${escapeHtml(ingredientSectionLabel(item.section))}</small>
          <small>Refeições: ${item.meals.map(escapeHtml).join(', ')}</small>
        </div>
        ${macroSummaryHtml(item, true)}
      </div>
    `;
  }

  function sortHistory(history) {
    return [...history].sort((a, b) => {
      const dateCompare = String(b.date || '').localeCompare(String(a.date || ''));
      if (dateCompare !== 0) return dateCompare;
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
  }

  function getPreviousRecord(exercise, record) {
    const ordered = sortHistory(exercise.history || []).reverse();
    const currentIndex = ordered.findIndex(item => item.id === record.id);
    if (currentIndex <= 0) return null;
    return ordered[currentIndex - 1];
  }

  function getProgression(current, previous) {
    if (!previous) {
      return { className: '', short: 'base', label: 'Primeiro registro' };
    }

    const weightDiff = current.weight - previous.weight;
    const repsDiff = current.reps - previous.reps;
    const weightMore = weightDiff > 0;
    const weightLess = weightDiff < 0;
    const repsMore = repsDiff > 0;
    const repsLess = repsDiff < 0;

    if (weightMore && repsMore) {
      return { className: 'progression-blue', short: diffText(weightDiff, repsDiff), label: 'Mais carga e mais repetições' };
    }
    if (weightMore && repsLess) {
      return { className: 'progression-green', short: diffText(weightDiff, repsDiff), label: 'Mais carga e menos repetições' };
    }
    if (weightLess && repsMore) {
      return { className: 'progression-yellow', short: diffText(weightDiff, repsDiff), label: 'Menos carga e mais repetições' };
    }
    if (weightLess && repsLess) {
      return { className: 'progression-orange', short: diffText(weightDiff, repsDiff), label: 'Menos carga e menos repetições' };
    }

    return { className: '', short: diffText(weightDiff, repsDiff), label: 'Sem combinação de progressão definida' };
  }

  function diffText(weightDiff, repsDiff) {
    const weight = weightDiff === 0 ? '0kg' : `${weightDiff > 0 ? '+' : ''}${formatNumber(weightDiff)}kg`;
    const reps = repsDiff === 0 ? '0rep' : `${repsDiff > 0 ? '+' : ''}${formatNumber(repsDiff)}rep`;
    return `${weight} ${reps}`;
  }

  function formatNumber(value) {
    const number = Number(value || 0);
    return Number.isInteger(number) ? String(number) : number.toFixed(1).replace('.', ',');
  }

  function openModal(title, html) {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modalBackdrop.hidden = false;
    const firstInput = modalBody.querySelector('input, select, textarea, button');
    window.setTimeout(() => firstInput?.focus(), 0);
  }

  function closeModal() {
    modalBackdrop.hidden = true;
    modalBody.innerHTML = '';
    modalTitle.textContent = '';
  }


  function renderWeightControl() {
    clearWorkoutTheme();
    pageTitle.textContent = 'Controle de peso';
    state.weightControl = normalizeWeightControl(state.weightControl);

    const summary = getWeightSummary();
    const latest = summary.latest;
    const records = sortWeightRecords(state.weightControl.records);

    app.innerHTML = `
      <section class="weight-hero">
        <div class="workout-hero-main">
          <div>
            <div class="hero-title-row">
              <span class="weight-hero-icon">⚖️</span>
              <h2>Controle de peso</h2>
            </div>
            <p class="small-muted">Registre peso, altura e BF por data. O sistema calcula as médias semanal e mensal automaticamente.</p>
            <div class="diet-mini-stats">
              <span class="pill">${summary.total} registro(s)</span>
              <span class="pill">Atual: ${latest ? `${formatNumber(latest.weight)} kg` : '-'}</span>
              <span class="pill">BF: ${latest && latest.bf ? `${formatNumber(latest.bf)}%` : '-'}</span>
            </div>
          </div>
          <div class="date-panel">
            <strong>${summary.weeklyAverage ? `${formatNumber(summary.weeklyAverage)} kg` : '-'}</strong>
            <span class="small-muted">média semanal</span>
            <strong>${summary.monthlyAverage ? `${formatNumber(summary.monthlyAverage)} kg` : '-'}</strong>
            <span class="small-muted">média mensal</span>
          </div>
        </div>
      </section>

      <section class="stats-grid weight-summary-grid" aria-label="Resumo de peso">
        <div class="stat-card">
          <strong>${latest ? `${formatNumber(latest.weight)} kg` : '-'}</strong>
          <span>último peso</span>
        </div>
        <div class="stat-card">
          <strong>${latest && latest.height ? `${formatNumber(latest.height)} cm` : '-'}</strong>
          <span>altura registrada</span>
        </div>
        <div class="stat-card">
          <strong>${latest && latest.bf ? `${formatNumber(latest.bf)}%` : '-'}</strong>
          <span>BF registrado</span>
        </div>
        <div class="stat-card">
          <strong>${latest && bmiForRecord(latest) ? formatNumber(bmiForRecord(latest)) : '-'}</strong>
          <span>IMC aproximado</span>
          <small class="imc-category">${latest && bmiForRecord(latest) ? bmiCategory(bmiForRecord(latest)) : '-'}</small>
        </div>
      </section>

      <section class="toolbar">
        <div class="toolbar-row">
          <div class="toolbar-text">
            <h2>Registros</h2>
            <p>Cadastre uma medição por data. Se repetir a data, o registro será atualizado.</p>
          </div>
          <button class="primary-button" data-action="new-weight-record">+ Novo registro</button>
        </div>
      </section>

      ${records.length ? `
        <section class="weight-list">
          ${records.map(renderWeightRecordCard).join('')}
        </section>
      ` : `
        <section class="empty-state">
          <h2>Nenhum peso cadastrado</h2>
          <p>Adicione o primeiro registro para calcular médias e acompanhar sua evolução.</p>
          <div style="margin-top: 16px;">
            <button class="primary-button" data-action="new-weight-record">Cadastrar peso</button>
          </div>
        </section>
      `}
    `;
  }

  function renderWeightRecordCard(record) {
    const imc = bmiForRecord(record);
    return `
      <article class="weight-card">
        <div>
          <h3>${formatDate(record.date)}</h3>
          <div class="weight-record-grid">
            <span><b>⚖️</b> ${formatNumber(record.weight)} kg</span>
            <span><b>📏</b> ${formatNumber(record.height)} cm</span>
            <span><b>📊</b> ${formatNumber(record.bf)}% BF</span>
            <span><b>🧮</b> ${imc ? formatNumber(imc) : '-'} IMC</span>
            <span><b>🏷️</b> ${escapeHtml(bmiCategory(imc))}</span>
          </div>
        </div>
        <div class="action-menu">
          <button class="mini-button" data-action="edit-weight-record" data-record-id="${record.id}" title="Editar registro">✎</button>
          <button class="mini-button" data-action="delete-weight-record" data-record-id="${record.id}" title="Excluir registro">🗑</button>
        </div>
      </article>
    `;
  }

  function workoutFormHtml(workout = null) {
    const isEdit = Boolean(workout);
    const selectedType = workout?.scheduleType || 'none';
    const fixedDays = workout?.fixedDays || [];
    return `
      <form id="workoutForm" class="form-grid">
        <div class="form-row">
          <label for="workoutName">Nome do treino</label>
          <input id="workoutName" name="name" required maxlength="60" value="${escapeHtml(workout?.name || '')}" placeholder="Ex.: Peito e tríceps" />
        </div>

        <div class="form-row inline">
          <div>
            <label for="workoutColor">Cor</label>
            <input id="workoutColor" name="color" type="color" value="${escapeHtml(workout?.color || '#38bdf8')}" />
          </div>
          <div>
            <label for="scheduleType">Dia de treino</label>
            <select id="scheduleType" name="scheduleType">
              <option value="none" ${selectedType === 'none' ? 'selected' : ''}>Sem dia fixo</option>
              <option value="fixed" ${selectedType === 'fixed' ? 'selected' : ''}>Dia fixo</option>
              <option value="rotative" ${selectedType === 'rotative' ? 'selected' : ''}>Rotativo</option>
            </select>
          </div>
        </div>

        <div class="form-row" id="fixedDaysBox" ${selectedType === 'fixed' ? '' : 'hidden'}>
          <label>Dias fixos</label>
          <div class="checkbox-grid">
            ${DAYS.map(([value, label]) => `
              <label class="checkbox-pill">
                <input type="checkbox" name="fixedDays" value="${value}" ${fixedDays.includes(value) ? 'checked' : ''} />
                ${label}
              </label>
            `).join('')}
          </div>
        </div>

        <div class="form-row">
          <label for="workoutNotes">Observação</label>
          <textarea id="workoutNotes" name="notes" maxlength="180" placeholder="Opcional">${escapeHtml(workout?.notes || '')}</textarea>
        </div>

        <div class="modal-actions">
          <button class="ghost-button" type="button" data-action="close-modal">Cancelar</button>
          <button class="primary-button" type="submit">${isEdit ? 'Salvar alterações' : 'Criar treino'}</button>
        </div>
      </form>
    `;
  }

  function openWorkoutForm(workoutId = null) {
    const workout = workoutId ? findWorkout(workoutId) : null;
    openModal(workout ? 'Editar treino' : 'Novo treino', workoutFormHtml(workout));

    const form = document.getElementById('workoutForm');
    const scheduleType = document.getElementById('scheduleType');
    const fixedDaysBox = document.getElementById('fixedDaysBox');

    scheduleType.addEventListener('change', () => {
      fixedDaysBox.hidden = scheduleType.value !== 'fixed';
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      const name = data.get('name').trim();
      if (!name) return;

      const payload = {
        name,
        color: data.get('color') || '#38bdf8',
        scheduleType: data.get('scheduleType') || 'none',
        fixedDays: data.get('scheduleType') === 'fixed' ? data.getAll('fixedDays') : [],
        notes: data.get('notes')?.trim() || ''
      };

      if (workout) {
        Object.assign(workout, payload);
        showToast('Treino atualizado.');
      } else {
        state.workouts.push({
          id: uid('workout'),
          ...payload,
          exercises: []
        });
        showToast('Treino criado.');
      }

      saveState();
      closeModal();
      render();
    });
  }

  function exerciseFormHtml(exercise = null) {
    const isEdit = Boolean(exercise);
    const sets = exercise?.sets?.length ? exercise.sets : [
      { id: uid('set'), defaultWeight: 0, defaultReps: 0 },
      { id: uid('set'), defaultWeight: 0, defaultReps: 0 },
      { id: uid('set'), defaultWeight: 0, defaultReps: 0 }
    ];

    return `
      <form id="exerciseForm" class="form-grid">
        <div class="form-row">
          <label for="exerciseName">Nome do exercício</label>
          <input id="exerciseName" name="name" required maxlength="70" value="${escapeHtml(exercise?.name || '')}" placeholder="Ex.: Supino reto" />
        </div>

        <div class="form-row">
          <label for="muscleGroup">Grupo muscular</label>
          <select id="muscleGroup" name="muscleGroup" required>
            <option value="">Selecione</option>
            ${MUSCLE_GROUPS.map(([value, label]) => `<option value="${value}" ${exercise?.muscleGroup === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>

        <div class="form-row">
          <label>Séries padrão</label>
          <div class="edit-set-list" id="editSetList">
            ${sets.map(set => editSetRowHtml(set)).join('')}
          </div>
          <button class="secondary-button" type="button" data-action="add-set-row">+ Adicionar série</button>
          <p class="small-muted">Esses valores aparecem apenas como base inicial. Depois que um registro é salvo, o formulário volta para zero.</p>
        </div>

        <div class="modal-actions">
          <button class="ghost-button" type="button" data-action="close-modal">Cancelar</button>
          <button class="primary-button" type="submit">${isEdit ? 'Salvar alterações' : 'Criar exercício'}</button>
        </div>
      </form>
    `;
  }

  function editSetRowHtml(set = null) {
    return `
      <div class="edit-set-row" data-edit-set-row data-set-id="${escapeHtml(set?.id || uid('set'))}">
        <label class="unit-input">
          <input type="number" min="0" step="0.5" inputmode="decimal" name="weight" value="${escapeHtml(set?.defaultWeight ?? 0)}" placeholder="Carga" aria-label="Carga padrão" />
          <span>kg</span>
        </label>
        <label class="unit-input">
          <input type="number" min="0" step="1" inputmode="numeric" name="reps" value="${escapeHtml(set?.defaultReps ?? 0)}" placeholder="Repetições" aria-label="Repetições padrão" />
          <span>reps</span>
        </label>
        <button class="mini-button" type="button" data-action="remove-set-row" title="Remover série">×</button>
      </div>
    `;
  }

  function openExerciseForm(workoutId, exerciseId = null) {
    const workout = findWorkout(workoutId);
    const exercise = exerciseId ? findExercise(workout, exerciseId) : null;
    if (!workout) return;

    openModal(exercise ? 'Editar exercício' : 'Novo exercício', exerciseFormHtml(exercise));

    const form = document.getElementById('exerciseForm');
    const setList = document.getElementById('editSetList');

    setList.addEventListener('click', event => {
      const button = event.target.closest('[data-action="remove-set-row"]');
      if (!button) return;
      const rows = [...setList.querySelectorAll('[data-edit-set-row]')];
      if (rows.length <= 1) {
        showToast('Mantenha pelo menos uma série.');
        return;
      }
      button.closest('[data-edit-set-row]').remove();
    });

    form.addEventListener('click', event => {
      const button = event.target.closest('[data-action="add-set-row"]');
      if (!button) return;
      setList.insertAdjacentHTML('beforeend', editSetRowHtml({ defaultWeight: 0, defaultReps: 0 }));
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      const name = form.elements.name.value.trim();
      const muscleGroup = form.elements.muscleGroup.value;
      if (!name || !muscleGroup) return;

      const sets = [...setList.querySelectorAll('[data-edit-set-row]')].map((row, index) => ({
        id: row.dataset.setId || uid('set'),
        order: index + 1,
        defaultWeight: parseNumber(row.querySelector('[name="weight"]').value),
        defaultReps: parseNumber(row.querySelector('[name="reps"]').value)
      }));

      if (exercise) {
        exercise.name = name;
        exercise.muscleGroup = muscleGroup;
        exercise.sets = sets;
        showToast('Exercício atualizado.');
      } else {
        workout.exercises = workout.exercises || [];
        workout.exercises.push({
          id: uid('exercise'),
          name,
          muscleGroup,
          sets,
          history: []
        });
        showToast('Exercício criado.');
      }

      saveState();
      closeModal();
      render();
    });
  }

  function mealFormHtml(meal = null) {
    const isEdit = Boolean(meal);
    const days = meal?.days || [];
    const ingredients = meal?.ingredients?.length ? meal.ingredients : [];
    return `
      <form id="mealForm" class="form-grid">
        <div class="form-row">
          <label for="mealName">Nome da refeição</label>
          <input id="mealName" name="name" required maxlength="70" value="${escapeHtml(meal?.name || '')}" placeholder="Ex.: Café da manhã" />
        </div>

        <div class="form-row">
          <label>Dias da semana</label>
          <div class="checkbox-grid">
            ${DAYS.map(([value, label]) => `
              <label class="checkbox-pill">
                <input type="checkbox" name="days" value="${value}" ${days.includes(value) ? 'checked' : ''} />
                ${label}
              </label>
            `).join('')}
          </div>
        </div>

        <div class="form-row">
          <label>Macros da refeição</label>
          <div class="macro-input-grid">
            ${macroInputHtml('kcal', '🔥 Kcal', meal?.kcal)}
            ${macroInputHtml('protein', '🥩 Proteína', meal?.protein)}
            ${macroInputHtml('fat', '🥑 Gordura', meal?.fat)}
            ${macroInputHtml('carbs', '🍚 Carboidrato', meal?.carbs)}
          </div>
          <p class="small-muted">Os ingredientes também somam nos macros totais da refeição.</p>
        </div>

        <div class="form-row">
          <label>Ingredientes</label>
          <div class="ingredient-edit-list" id="ingredientEditList">
            ${ingredients.map(ingredient => ingredientRowHtml(ingredient)).join('')}
          </div>
          <button class="secondary-button" type="button" data-action="add-ingredient-row">+ Ingrediente</button>
        </div>

        <div class="modal-actions">
          <button class="ghost-button" type="button" data-action="close-modal">Cancelar</button>
          <button class="primary-button" type="submit">${isEdit ? 'Salvar alterações' : 'Criar refeição'}</button>
        </div>
      </form>
    `;
  }

  function macroInputHtml(name, label, value = 0) {
    return `
      <div>
        <label>${label}</label>
        <input type="number" min="0" step="0.1" inputmode="decimal" name="${name}" value="${escapeHtml(value ?? 0)}" />
      </div>
    `;
  }

  function ingredientRowHtml(ingredient = null) {
    return `
      <div class="ingredient-edit-row" data-ingredient-row data-ingredient-id="${escapeHtml(ingredient?.id || uid('ingredient'))}">
        <input name="ingredientName" maxlength="70" value="${escapeHtml(ingredient?.name || '')}" placeholder="Ingrediente" aria-label="Ingrediente" />
        <input type="number" min="0" step="0.1" inputmode="decimal" name="ingredientKcal" value="${escapeHtml(ingredient?.kcal ?? 0)}" placeholder="🔥 kcal" aria-label="Kcal" />
        <input type="number" min="0" step="0.1" inputmode="decimal" name="ingredientProtein" value="${escapeHtml(ingredient?.protein ?? 0)}" placeholder="🥩 prot" aria-label="Proteína" />
        <input type="number" min="0" step="0.1" inputmode="decimal" name="ingredientFat" value="${escapeHtml(ingredient?.fat ?? 0)}" placeholder="🥑 gord" aria-label="Gordura" />
        <input type="number" min="0" step="0.1" inputmode="decimal" name="ingredientCarbs" value="${escapeHtml(ingredient?.carbs ?? 0)}" placeholder="🍚 carb" aria-label="Carboidrato" />
        <select name="ingredientSection" aria-label="Seção da lista de compras">
          ${INGREDIENT_SECTIONS.map(([value, label]) => `<option value="${value}" ${(ingredient?.section || 'outros') === value ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
        <button class="mini-button" type="button" data-action="remove-ingredient-row" title="Remover ingrediente">×</button>
      </div>
    `;
  }

  function openMealForm(mealId = null) {
    const meal = mealId ? findMeal(mealId) : null;
    openModal(meal ? 'Editar refeição' : 'Nova refeição', mealFormHtml(meal));

    const form = document.getElementById('mealForm');
    const ingredientList = document.getElementById('ingredientEditList');

    form.addEventListener('click', event => {
      const addButton = event.target.closest('[data-action="add-ingredient-row"]');
      if (addButton) ingredientList.insertAdjacentHTML('beforeend', ingredientRowHtml());

      const removeButton = event.target.closest('[data-action="remove-ingredient-row"]');
      if (removeButton) removeButton.closest('[data-ingredient-row]').remove();
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      const name = data.get('name').trim();
      const days = data.getAll('days');

      if (!name) return;
      if (!days.length) {
        showToast('Selecione pelo menos um dia da semana.');
        return;
      }

      const ingredients = [...ingredientList.querySelectorAll('[data-ingredient-row]')]
        .map(row => ({
          id: row.dataset.ingredientId || uid('ingredient'),
          name: row.querySelector('[name="ingredientName"]').value.trim(),
          kcal: parseNumber(row.querySelector('[name="ingredientKcal"]').value),
          protein: parseNumber(row.querySelector('[name="ingredientProtein"]').value),
          fat: parseNumber(row.querySelector('[name="ingredientFat"]').value),
          carbs: parseNumber(row.querySelector('[name="ingredientCarbs"]').value),
          section: row.querySelector('[name="ingredientSection"]')?.value || 'outros'
        }))
        .filter(ingredient => ingredient.name || ingredient.kcal || ingredient.protein || ingredient.fat || ingredient.carbs);

      const payload = {
        name,
        days,
        kcal: parseNumber(data.get('kcal')),
        protein: parseNumber(data.get('protein')),
        fat: parseNumber(data.get('fat')),
        carbs: parseNumber(data.get('carbs')),
        ingredients
      };

      if (meal) {
        Object.assign(meal, payload);
        showToast('Refeição atualizada.');
      } else {
        state.diet.meals.push({ id: uid('meal'), ...payload });
        showToast('Refeição criada.');
      }

      saveState();
      closeModal();
      render();
    });
  }

  function extraMealFormHtml() {
    return `
      <form id="extraMealForm" class="form-grid">
        <div class="form-row inline">
          <div>
            <label for="extraDate">Data</label>
            <input id="extraDate" name="date" type="date" value="${escapeHtml(ui.dietDate || todayISO())}" required />
          </div>
          <div>
            <label for="extraName">Nome</label>
            <input id="extraName" name="name" required maxlength="70" placeholder="Ex.: Pizza, lanche, sobremesa" />
          </div>
        </div>

        <div class="form-row">
          <label>Macros</label>
          <div class="macro-input-grid">
            ${macroInputHtml('kcal', '🔥 Kcal', 0)}
            ${macroInputHtml('protein', '🥩 Proteína', 0)}
            ${macroInputHtml('fat', '🥑 Gordura', 0)}
            ${macroInputHtml('carbs', '🍚 Carboidrato', 0)}
          </div>
        </div>

        <div class="form-row">
          <label for="extraNote">Observação</label>
          <textarea id="extraNote" name="note" maxlength="180" placeholder="Opcional"></textarea>
        </div>

        <div class="modal-actions">
          <button class="ghost-button" type="button" data-action="close-modal">Cancelar</button>
          <button class="primary-button" type="submit">Salvar fora do padrão</button>
        </div>
      </form>
    `;
  }

  function openExtraMealForm() {
    openModal('Refeição fora do padrão', extraMealFormHtml());
    const form = document.getElementById('extraMealForm');

    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      const name = data.get('name').trim();
      const date = data.get('date') || ui.dietDate || todayISO();
      if (!name) return;

      const extra = {
        id: uid('extra'),
        date,
        name,
        kcal: parseNumber(data.get('kcal')),
        protein: parseNumber(data.get('protein')),
        fat: parseNumber(data.get('fat')),
        carbs: parseNumber(data.get('carbs')),
        note: data.get('note')?.trim() || ''
      };

      state.diet.extraMeals.push(extra);
      const log = ensureDietLog(date);
      log.extraIds = Array.from(new Set([...log.extraIds, extra.id]));
      if (log.broken) log.broken = false;
      state.diet.completions[date] = log;
      ui.dietDate = date;
      saveState();
      closeModal();
      showToast('Refeição fora do padrão salva.');
      render();
    });
  }

  function freeMealsFormHtml() {
    const slots = state.diet.freeMealSlots || [];
    const count = slots.length || 0;
    return `
      <form id="freeMealsForm" class="form-grid">
        <div class="form-row">
          <label for="freeMealCount">Quantidade semanal</label>
          <select id="freeMealCount" name="count">
            <option value="0" ${count === 0 ? 'selected' : ''}>Nenhuma</option>
            <option value="1" ${count === 1 ? 'selected' : ''}>1 refeição livre</option>
            <option value="2" ${count === 2 ? 'selected' : ''}>2 refeições livres</option>
          </select>
        </div>

        <div class="free-slot-list" id="freeSlotList">
          ${[0, 1].map(index => freeMealSlotHtml(slots[index], index)).join('')}
        </div>

        <div class="modal-actions">
          <button class="ghost-button" type="button" data-action="close-modal">Cancelar</button>
          <button class="primary-button" type="submit">Salvar refeições livres</button>
        </div>
      </form>
    `;
  }

  function freeMealSlotHtml(slot, index) {
    return `
      <div class="free-slot-row" data-free-slot-row data-slot-index="${index}">
        <div>
          <label>Dia</label>
          <select name="freeDay">
            ${DAYS.map(([value, label]) => `<option value="${value}" ${slot?.day === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Nome</label>
          <input name="freeName" maxlength="60" value="${escapeHtml(slot?.name || `Refeição livre ${index + 1}`)}" />
        </div>
      </div>
    `;
  }

  function openFreeMealsForm() {
    openModal('Refeições livres', freeMealsFormHtml());
    const form = document.getElementById('freeMealsForm');

    form.addEventListener('submit', event => {
      event.preventDefault();
      const count = Math.min(2, Math.max(0, Number(form.elements.count.value || 0)));
      const rows = [...form.querySelectorAll('[data-free-slot-row]')];
      state.diet.freeMealSlots = rows.slice(0, count).map((row, index) => ({
        id: state.diet.freeMealSlots?.[index]?.id || uid('free'),
        day: row.querySelector('[name="freeDay"]').value,
        name: row.querySelector('[name="freeName"]').value.trim() || `Refeição livre ${index + 1}`
      }));
      saveState();
      closeModal();
      showToast('Refeições livres atualizadas.');
      render();
    });
  }


  function weightRecordFormHtml(record = null) {
    return `
      <form id="weightRecordForm" class="form-grid">
        <div class="form-row inline">
          <div>
            <label for="weightDate">Data</label>
            <input id="weightDate" name="date" type="date" value="${escapeHtml(record?.date || todayISO())}" required />
          </div>
          <div>
            <label for="weightValue">Peso atual</label>
            <label class="unit-input">
              <input id="weightValue" name="weight" type="number" min="0" step="0.1" inputmode="decimal" value="${escapeHtml(record?.weight ?? '')}" placeholder="Ex.: 95" required />
              <span>kg</span>
            </label>
          </div>
        </div>

        <div class="form-row inline">
          <div>
            <label for="heightValue">Altura</label>
            <label class="unit-input">
              <input id="heightValue" name="height" type="number" min="0" step="0.1" inputmode="decimal" value="${escapeHtml(record?.height ?? '')}" placeholder="Ex.: 180" required />
              <span>cm</span>
            </label>
          </div>
          <div>
            <label for="bfValue">BF</label>
            <label class="unit-input">
              <input id="bfValue" name="bf" type="number" min="0" max="100" step="0.1" inputmode="decimal" value="${escapeHtml(record?.bf ?? '')}" placeholder="Ex.: 18" required />
              <span>%</span>
            </label>
          </div>
        </div>

        <div class="modal-actions">
          <button class="ghost-button" type="button" data-action="close-modal">Cancelar</button>
          <button class="primary-button" type="submit">Salvar registro</button>
        </div>
      </form>
    `;
  }

  function openWeightRecordForm(recordId = null) {
    const record = recordId ? findWeightRecord(recordId) : null;
    openModal(record ? 'Editar peso' : 'Novo peso', weightRecordFormHtml(record));
    const form = document.getElementById('weightRecordForm');

    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      const date = data.get('date') || todayISO();
      const weight = parseNumber(data.get('weight'));
      let height = parseNumber(data.get('height'));
      const bf = parseNumber(data.get('bf'));

      if (!weight || !height || !bf) {
        showToast('Preencha peso, altura e BF.');
        return;
      }

      if (height <= 3) height *= 100;

      state.weightControl = normalizeWeightControl(state.weightControl);
      const sameDate = state.weightControl.records.find(item => item.date === date && item.id !== recordId);
      const payload = {
        date,
        weight,
        height,
        bf,
        updatedAt: new Date().toISOString()
      };

      if (record) {
        Object.assign(record, payload);
        showToast('Registro atualizado.');
      } else if (sameDate) {
        Object.assign(sameDate, payload);
        showToast('Registro da data atualizado.');
      } else {
        state.weightControl.records.push({ id: uid('weight'), ...payload });
        showToast('Peso registrado.');
      }

      saveState();
      closeModal();
      render();
    });
  }

  function saveExerciseRecord(workoutId, exerciseId, card) {
    const workout = findWorkout(workoutId);
    const exercise = findExercise(workout, exerciseId);
    if (!exercise) return;

    const dateInput = document.getElementById('recordDate');
    const date = dateInput?.value || todayISO();
    const mood = ui.draftMood[exerciseId] || card.querySelector('.mood-button.active')?.dataset.mood || '';

    if (!mood) {
      showToast('Escolha a sensação antes de salvar o registro.');
      return;
    }

    const rawSets = (exercise.sets || []).map((set, index) => {
      const safeId = window.CSS && CSS.escape ? CSS.escape(set.id) : set.id;
      const weightInput = card.querySelector(`[data-set-weight="${safeId}"]`);
      const repsInput = card.querySelector(`[data-set-reps="${safeId}"]`);
      return {
        setId: set.id,
        setNumber: index + 1,
        weight: parseNumber(weightInput?.value),
        reps: parseNumber(repsInput?.value)
      };
    });

    const sets = rawSets.filter(set => set.weight > 0 || set.reps > 0);
    if (!sets.length) {
      showToast('Informe carga ou repetições antes de salvar.');
      return;
    }

    exercise.history = exercise.history || [];
    const sameDayIndex = exercise.history.findIndex(record => record.date === date);
    const record = {
      id: sameDayIndex >= 0 ? exercise.history[sameDayIndex].id : uid('record'),
      date,
      mood,
      sets,
      createdAt: new Date().toISOString()
    };

    if (sameDayIndex >= 0) {
      exercise.history[sameDayIndex] = record;
    } else {
      exercise.history.push(record);
    }

    exercise.history = sortHistory(exercise.history).reverse().slice(-MAX_HISTORY);
    exercise.sets = exercise.sets.map(set => ({
      ...set,
      defaultWeight: 0,
      defaultReps: 0
    }));
    delete ui.draftMood[exerciseId];

    saveState();
    showToast(sameDayIndex >= 0 ? 'Registro do dia atualizado.' : 'Registro salvo.');
    render();
  }

  function deleteWorkout(workoutId) {
    const workout = findWorkout(workoutId);
    if (!workout) return;
    const ok = window.confirm(`Excluir o treino "${workout.name}"? O histórico dos exercícios também será removido.`);
    if (!ok) return;

    state.workouts = state.workouts.filter(item => item.id !== workoutId);
    saveState();
    showToast('Treino excluído.');
    if (getRoute().name === 'workout') navigate('#workouts');
    render();
  }

  function deleteExercise(workoutId, exerciseId) {
    const workout = findWorkout(workoutId);
    const exercise = findExercise(workout, exerciseId);
    if (!workout || !exercise) return;
    const ok = window.confirm(`Excluir o exercício "${exercise.name}"? O histórico dele também será removido.`);
    if (!ok) return;

    workout.exercises = workout.exercises.filter(item => item.id !== exerciseId);
    delete ui.draftMood[exerciseId];
    delete ui.historyMode[exerciseId];
    saveState();
    showToast('Exercício excluído.');
    render();
  }

  function deleteMeal(mealId) {
    const meal = findMeal(mealId);
    if (!meal) return;
    const ok = window.confirm(`Excluir a refeição "${meal.name}"?`);
    if (!ok) return;

    state.diet.meals = state.diet.meals.filter(item => item.id !== mealId);
    Object.values(state.diet.completions || {}).forEach(log => {
      log.mealIds = (log.mealIds || []).filter(id => id !== mealId);
    });
    saveState();
    showToast('Refeição excluída.');
    render();
  }

  function deleteExtraMeal(extraId) {
    const extra = findExtraMeal(extraId);
    if (!extra) return;
    const ok = window.confirm(`Excluir "${extra.name}"?`);
    if (!ok) return;

    state.diet.extraMeals = state.diet.extraMeals.filter(item => item.id !== extraId);
    Object.values(state.diet.completions || {}).forEach(log => {
      log.extraIds = (log.extraIds || []).filter(id => id !== extraId);
    });
    saveState();
    showToast('Refeição avulsa excluída.');
    render();
  }


  function deleteWeightRecord(recordId) {
    const record = findWeightRecord(recordId);
    if (!record) return;
    const ok = window.confirm(`Excluir o registro de ${formatDate(record.date)}?`);
    if (!ok) return;

    state.weightControl.records = state.weightControl.records.filter(item => item.id !== recordId);
    saveState();
    showToast('Registro de peso excluído.');
    render();
  }

  function toggleDietBreak() {
    const date = ui.dietDate || todayISO();
    const log = ensureDietLog(date);

    if (log.broken) {
      log.broken = false;
      state.diet.completions[date] = log;
      saveState();
      showToast('Furo removido.');
      render();
      return;
    }

    const ok = window.confirm('Marcar que você furou a dieta nesta data? A sequência será resetada.');
    if (!ok) return;

    log.broken = true;
    log.mealIds = [];
    log.freeIds = [];
    log.extraIds = [];
    state.diet.completions[date] = log;
    saveState();
    showToast('Dieta marcada como furada.');
    render();
  }

  function openDataTools() {
    openModal('Dados do sistema', `
      <div class="data-tools">
        <p class="small-muted">Exporte um backup em JSON, carregue dados salvos ou limpe todos os dados locais deste navegador.</p>
        <button class="primary-button" type="button" data-action="export-json">Salvar JSON</button>
        <label class="secondary-button file-button" for="jsonImportInput">Carregar JSON</label>
        <input id="jsonImportInput" type="file" accept="application/json,.json" hidden />
        <button class="danger-button" type="button" data-action="delete-json-data">Excluir dados</button>
      </div>
    `);

    const input = document.getElementById('jsonImportInput');
    input?.addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (file) importJsonFile(file);
    });
  }

  function exportJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'treino-web',
      version: 1,
      data: state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `treino-web-backup-${todayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('JSON salvo.');
  }

  function importJsonFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        const imported = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
        state = {
          workouts: Array.isArray(imported.workouts) ? imported.workouts : [],
          diet: normalizeDiet(imported.diet),
          weightControl: normalizeWeightControl(imported.weightControl)
        };
        saveState();
        closeModal();
        showToast('JSON carregado.');
        render();
      } catch (error) {
        console.error(error);
        showToast('JSON inválido.');
      }
    };
    reader.readAsText(file);
  }

  function deleteJsonData() {
    const confirmed = window.confirm('Excluir todos os treinos, dieta, peso e histórico deste navegador?');
    if (!confirmed) return;
    state = { workouts: [], diet: defaultDiet(), weightControl: defaultWeightControl() };
    saveState();
    closeModal();
    showToast('Dados excluídos.');
    render();
  }

  document.addEventListener('click', event => {
    const actionElement = event.target.closest('[data-action]');
    if (!actionElement) return;

    const action = actionElement.dataset.action;

    if (action === 'go-workouts') navigate('#workouts');
    if (action === 'go-diet') navigate('#diet');
    if (action === 'go-weight') navigate('#weight');
    if (action === 'open-data-tools') openDataTools();
    if (action === 'export-json') exportJson();
    if (action === 'delete-json-data') deleteJsonData();
    if (action === 'coming-soon') showToast('Área reservada para uma próxima etapa.');
    if (action === 'new-workout') openWorkoutForm();
    if (action === 'edit-workout') openWorkoutForm(actionElement.dataset.workoutId);
    if (action === 'delete-workout') deleteWorkout(actionElement.dataset.workoutId);
    if (action === 'open-workout') navigate(`#workout/${actionElement.dataset.workoutId}`);
    if (action === 'new-exercise') openExerciseForm(actionElement.dataset.workoutId);
    if (action === 'edit-exercise') openExerciseForm(actionElement.dataset.workoutId, actionElement.dataset.exerciseId);
    if (action === 'delete-exercise') deleteExercise(actionElement.dataset.workoutId, actionElement.dataset.exerciseId);
    if (action === 'new-meal') openMealForm();
    if (action === 'edit-meal') openMealForm(actionElement.dataset.mealId);
    if (action === 'delete-meal') deleteMeal(actionElement.dataset.mealId);
    if (action === 'new-extra-meal') openExtraMealForm();
    if (action === 'delete-extra-meal') deleteExtraMeal(actionElement.dataset.extraId);
    if (action === 'configure-free-meals') openFreeMealsForm();
    if (action === 'toggle-diet-break') toggleDietBreak();
    if (action === 'toggle-shopping-sort') document.querySelector('.shopping-section-list, .shopping-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (action === 'new-weight-record') openWeightRecordForm();
    if (action === 'edit-weight-record') openWeightRecordForm(actionElement.dataset.recordId);
    if (action === 'delete-weight-record') deleteWeightRecord(actionElement.dataset.recordId);
    if (action === 'close-modal') closeModal();

    if (['show-history', 'hide-history', 'show-full-history', 'show-short-history'].includes(action)) {
      const exerciseId = actionElement.dataset.exerciseId;
      if (action === 'show-history') ui.historyMode[exerciseId] = 'short';
      if (action === 'hide-history') delete ui.historyMode[exerciseId];
      if (action === 'show-full-history') ui.historyMode[exerciseId] = 'full';
      if (action === 'show-short-history') ui.historyMode[exerciseId] = 'short';
      render();
    }

    if (action === 'choose-mood') {
      const exerciseId = actionElement.dataset.exerciseId;
      ui.draftMood[exerciseId] = actionElement.dataset.mood;
      const card = actionElement.closest('[data-exercise-card]');
      card.querySelectorAll('.mood-button').forEach(button => button.classList.remove('active'));
      actionElement.classList.add('active');
    }

    if (action === 'save-exercise-record') {
      const card = actionElement.closest('[data-exercise-card]');
      saveExerciseRecord(actionElement.dataset.workoutId, actionElement.dataset.exerciseId, card);
    }

    if (action === 'toggle-meal-completion') {
      toggleCompletion(actionElement.dataset.date, 'meal', actionElement.dataset.mealId);
    }

    if (action === 'toggle-extra-completion') {
      toggleCompletion(actionElement.dataset.date, 'extra', actionElement.dataset.extraId);
    }

    if (action === 'toggle-free-completion') {
      toggleCompletion(actionElement.dataset.date, 'free', actionElement.dataset.freeId);
    }
  });

  document.addEventListener('change', event => {
    const recordDate = event.target.closest('[data-action="change-record-date"]');
    if (recordDate) {
      ui.currentDate = recordDate.value || todayISO();
      return;
    }

    const dietDate = event.target.closest('[data-action="change-diet-date"]');
    if (dietDate) {
      ui.dietDate = dietDate.value || todayISO();
      render();
    }

    const shoppingSort = event.target.closest('[data-action="change-shopping-sort"]');
    if (shoppingSort) {
      ui.shoppingSort = shoppingSort.value || 'section';
      render();
    }
  });

  backButton.addEventListener('click', () => {
    const route = getRoute();
    if (route.name === 'workout') navigate('#workouts');
    else navigate('#home');
  });

  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', event => {
    if (event.target === modalBackdrop) closeModal();
  });

  window.addEventListener('hashchange', render);
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modalBackdrop.hidden) closeModal();
  });

  if (!window.location.hash) window.location.hash = '#home';
  render();
})();
