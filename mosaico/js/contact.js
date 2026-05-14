(() => {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (!form || !status) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const nombre = (data.get('nombre') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const asunto = (data.get('asunto') || '').toString().trim();
    const mensaje = (data.get('mensaje') || '').toString().trim();

    if (!nombre || !email || !asunto || !mensaje) {
      status.textContent = 'Por favor, completa todos los campos.';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.textContent = 'Revisa tu email.';
      return;
    }

    const subject = encodeURIComponent(`[Portafolio] ${asunto}`);
    const body = encodeURIComponent(
      `Hola Valentina,\n\nMi nombre es ${nombre}.\n\n${mensaje}\n\n— ${email}`
    );

    window.location.href = `mailto:hola@valentinarojas.art?subject=${subject}&body=${body}`;
    status.textContent = 'Abriendo tu correo…';
    form.reset();
  });
})();
