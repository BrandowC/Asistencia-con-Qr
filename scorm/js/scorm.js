/**
 * Wrapper SCORM 1.2 con respaldo en localStorage si la página se abre fuera de Moodle.
 * Variables soportadas:
 *   cmi.core.lesson_status      passed/incomplete/completed
 *   cmi.core.score.raw          0..100
 *   cmi.core.session_time       hh:mm:ss
 *   cmi.suspend_data            JSON con progreso
 *   cmi.core.lesson_location    string corto
 */
(function (global) {
  'use strict';

  const STORE_KEY = 'app-attendance.scorm.fallback';
  let api = null;
  let connected = false;
  let startTime = Date.now();

  function findApi(win) {
    let depth = 0;
    let current = win;
    while (current && depth < 8) {
      if (current.API) return current.API;
      if (current.parent === current) break;
      current = current.parent;
      depth += 1;
    }
    if (win.opener) return findApi(win.opener);
    return null;
  }

  function init() {
    try {
      api = findApi(window);
      if (api) {
        const ok = api.LMSInitialize('');
        connected = ok === 'true' || ok === true;
      }
    } catch (e) {
      console.warn('[scorm] LMSInitialize falló:', e);
      connected = false;
    }
    if (!connected) {
      console.info('[scorm] Sin LMS detectado — usando localStorage como fallback.');
    }
    return connected;
  }

  function readFallback() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function writeFallback(data) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[scorm] no se pudo escribir fallback', e);
    }
  }

  function getValue(key) {
    if (connected && api) {
      try {
        return api.LMSGetValue(key) || '';
      } catch (e) {
        console.warn('[scorm] LMSGetValue', key, e);
      }
    }
    const data = readFallback();
    return data[key] || '';
  }

  function setValue(key, value) {
    if (connected && api) {
      try {
        api.LMSSetValue(key, String(value));
        return true;
      } catch (e) {
        console.warn('[scorm] LMSSetValue', key, e);
      }
    }
    const data = readFallback();
    data[key] = String(value);
    writeFallback(data);
    return false;
  }

  function commit() {
    if (connected && api) {
      try {
        api.LMSCommit('');
      } catch (e) {
        console.warn('[scorm] LMSCommit', e);
      }
    }
  }

  function finish() {
    setSessionTime();
    if (connected && api) {
      try {
        api.LMSCommit('');
        api.LMSFinish('');
      } catch (e) {
        console.warn('[scorm] LMSFinish', e);
      }
    }
  }

  function setStatus(status) {
    setValue('cmi.core.lesson_status', status);
  }

  function setScore(raw, max = 100, min = 0) {
    setValue('cmi.core.score.raw', String(raw));
    setValue('cmi.core.score.max', String(max));
    setValue('cmi.core.score.min', String(min));
  }

  function setLocation(loc) {
    setValue('cmi.core.lesson_location', String(loc).slice(0, 200));
  }

  function setSuspendData(obj) {
    try {
      setValue('cmi.suspend_data', JSON.stringify(obj).slice(0, 4000));
    } catch (e) {
      console.warn('[scorm] suspend_data', e);
    }
  }

  function getSuspendData() {
    const raw = getValue('cmi.suspend_data');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function setSessionTime() {
    const elapsedMs = Date.now() - startTime;
    const total = Math.floor(elapsedMs / 1000);
    const hh = String(Math.floor(total / 3600)).padStart(2, '0');
    const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const ss = String(total % 60).padStart(2, '0');
    setValue('cmi.core.session_time', `${hh}:${mm}:${ss}`);
  }

  global.SCORM = {
    init,
    isConnected: () => connected,
    getValue,
    setValue,
    setStatus,
    setScore,
    setLocation,
    setSuspendData,
    getSuspendData,
    commit,
    finish,
  };

  window.addEventListener('beforeunload', finish);
})(window);
