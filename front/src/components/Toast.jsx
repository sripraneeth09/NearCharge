import { useEffect, useRef } from 'react';

let _showToast = null;

export function setToastRef(fn) {
  _showToast = fn;
}

export function showToast(message, type = 'success') {
  if (_showToast) _showToast(message, type);
}

export default function Toast() {
  const toastRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    setToastRef((message, type = 'success') => {
      const el = toastRef.current;
      if (!el) return;
      el.querySelector('span').textContent = message;
      el.className = `toast show ${type}`;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        el.classList.remove('show');
      }, 3000);
    });
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="toast" ref={toastRef}>
      <i className="fas fa-check-circle" />
      <span>Success!</span>
    </div>
  );
}
