(function () {
  'use strict';

  const QUIZ_ANSWERS = {
    q1: 'b',
    q2: 'c',
    q3: 'b',
    q4: 'a',
    q5: 'c',
  };

  const PROGRESS_SECTIONS = [
    'problema',
    'funcionalidades',
    'arquitectura',
    'flujo',
    'modelo',
    'api',
    'instalacion',
    'codigo',
    'seguridad',
    'moodle',
    'sustentacion',
    'validacion',
    'roadmap',
    'autoevaluacion',
  ];

  function $(sel, root = document) {
    return root.querySelector(sel);
  }
  function $$(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function setupCopyButtons() {
    $$('.code-block').forEach((block) => {
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.type = 'button';
      btn.textContent = 'Copiar';
      btn.addEventListener('click', async () => {
        const code = block.querySelector('code');
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code.textContent || '');
          btn.textContent = 'Copiado';
          setTimeout(() => (btn.textContent = 'Copiar'), 1500);
        } catch {
          btn.textContent = 'Error';
        }
      });
      block.appendChild(btn);
    });
  }

  function getQuizState() {
    const restored = window.SCORM.getSuspendData();
    return restored && restored.quiz ? restored.quiz : {};
  }

  function setupQuiz() {
    const form = $('#quiz-form');
    if (!form) return;
    const state = getQuizState();

    Object.entries(state).forEach(([name, value]) => {
      const input = form.querySelector(`input[name="${name}"][value="${value}"]`);
      if (input) input.checked = true;
    });

    const button = $('#quiz-submit');
    if (!button) return;

    button.addEventListener('click', () => {
      const data = new FormData(form);
      let correct = 0;
      const stored = {};
      Object.keys(QUIZ_ANSWERS).forEach((q) => {
        const value = data.get(q);
        if (value) stored[q] = value;
        if (value === QUIZ_ANSWERS[q]) correct += 1;
      });

      const score = Math.round((correct / Object.keys(QUIZ_ANSWERS).length) * 100);
      const result = $('#quiz-result');
      if (result) {
        result.className = `feedback ${score >= 60 ? 'ok' : 'fail'}`;
        result.textContent = `Resultado: ${correct}/${Object.keys(QUIZ_ANSWERS).length} correctas (${score}/100). ${
          score >= 60 ? 'Aprobado.' : 'Repasa el material e inténtalo de nuevo.'
        }`;
      }

      window.SCORM.setScore(score);
      window.SCORM.setStatus(score >= 60 ? 'passed' : 'failed');
      const suspend = window.SCORM.getSuspendData() || {};
      suspend.quiz = stored;
      suspend.lastScore = score;
      suspend.completedAt = new Date().toISOString();
      window.SCORM.setSuspendData(suspend);
      window.SCORM.commit();
    });
  }

  function setupProgress() {
    const visited = new Set();
    const restored = window.SCORM.getSuspendData();
    if (restored && Array.isArray(restored.visited)) {
      restored.visited.forEach((s) => visited.add(s));
    }

    const pill = $('#progress-pill');

    function refresh() {
      if (!pill) return;
      const total = PROGRESS_SECTIONS.length;
      const seen = PROGRESS_SECTIONS.filter((s) => visited.has(s)).length;
      const pct = Math.round((seen / total) * 100);
      pill.textContent = `Progreso: ${pct}%`;
      const status = window.SCORM.getValue('cmi.core.lesson_status');
      if (status !== 'passed' && status !== 'failed') {
        window.SCORM.setStatus(seen === total ? 'completed' : 'incomplete');
      }
      const suspend = window.SCORM.getSuspendData() || {};
      suspend.visited = Array.from(visited);
      window.SCORM.setSuspendData(suspend);
    }

    refresh();

    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (PROGRESS_SECTIONS.includes(id)) {
              visited.add(id);
              window.SCORM.setLocation(id);
              refresh();
              window.SCORM.commit();
            }
          }
        });
      },
      { threshold: 0.4 },
    );

    PROGRESS_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  function setupLmsBadge() {
    const badge = $('#lms-status');
    if (!badge) return;
    if (window.SCORM.isConnected()) {
      badge.textContent = 'Conectado a LMS (SCORM 1.2)';
      badge.classList.add('connected');
    } else {
      badge.textContent = 'Modo offline (fallback localStorage)';
    }
  }

  function setupChecklistPersistence() {
    const restored = window.SCORM.getSuspendData() || {};
    const checks = restored.checks || {};
    $$('input.persist-check').forEach((input) => {
      if (checks[input.id]) input.checked = true;
      input.addEventListener('change', () => {
        const suspend = window.SCORM.getSuspendData() || {};
        suspend.checks = suspend.checks || {};
        suspend.checks[input.id] = input.checked;
        window.SCORM.setSuspendData(suspend);
        window.SCORM.commit();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.SCORM.init();
    setupLmsBadge();
    setupCopyButtons();
    setupQuiz();
    setupProgress();
    setupChecklistPersistence();
  });
})();
