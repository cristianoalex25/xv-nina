/**
 * XV DA NINA - EDIÇÃO ESPECIAL BRIDGERTON
 * Lógica do Formulário, Validação e Integração com Google Sheets
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // CONFIGURAÇÃO DO GOOGLE SHEETS
  // Cole aqui a URL do seu Google Apps Script quando configurado (veja COMO_PUBLICAR.md)
  // Se deixado vazio, o formulário salvará em modo demonstração no navegador.
  // =========================================================================
  const GOOGLE_SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbywQ-2DBUYyEhV850q4ow1lTdEC9TKN95YgftAJgcMhgJory6v99x0Q8ROrrtRB094WPA/exec'; 

  // Elementos do DOM
  const form = document.getElementById('rsvpForm');
  const guestName = document.getElementById('guestName');
  const attendanceRadios = document.querySelectorAll('input[name="attendance"]');
  const dinnerSection = document.getElementById('dinnerDetailsSection');
  const dietarySelect = document.getElementById('dietaryRequirement');
  const otherDietaryGroup = document.getElementById('otherDietaryGroup');
  const dietaryDetail = document.getElementById('dietaryDetail');
  const guestPhone = document.getElementById('guestPhone');
  const guestMessage = document.getElementById('guestMessage');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnIcon = submitBtn.querySelector('.btn-icon');
  const spinner = submitBtn.querySelector('.spinner');
  const formError = document.getElementById('formError');
  
  const successCard = document.getElementById('successCard');
  const successHeading = document.getElementById('successHeading');
  const successBody = document.getElementById('successBody');
  const addToCalendarBtn = document.getElementById('addToCalendarBtn');
  const editResponseBtn = document.getElementById('editResponseBtn');

  // 1. Máscara de Telefone (Brasil)
  guestPhone.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{4,5})(\d{0,4})$/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    } else if (value.length > 0) {
      value = value.replace(/^(\d*)$/, '($1');
    }
    e.target.value = value;
  });

  // 2. Controle de Exibição Condicional (Sim / Não na presença)
  attendanceRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'Sim') {
        dinnerSection.classList.remove('hidden');
        dietarySelect.required = true;
      } else {
        dinnerSection.classList.add('hidden');
        dietarySelect.required = false;
        dietarySelect.value = '';
        otherDietaryGroup.classList.add('hidden');
        dietaryDetail.value = '';
      }
    });
  });

  // 3. Controle da Opção "Outra" na Restrição Alimentar
  dietarySelect.addEventListener('change', () => {
    if (dietarySelect.value === 'Outra') {
      otherDietaryGroup.classList.remove('hidden');
      dietaryDetail.focus();
    } else {
      otherDietaryGroup.classList.add('hidden');
      dietaryDetail.value = '';
    }
  });

  // 4. Envio do Formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.add('hidden');
    formError.textContent = '';

    // Validação básica
    const selectedAttendance = document.querySelector('input[name="attendance"]:checked');
    if (!selectedAttendance) {
      showError('Por favor, informe se Vossa Senhoria honrará com sua presença.');
      return;
    }

    if (guestPhone.value.trim().length < 14) {
      showError('Por favor, digite um número de WhatsApp válido com DDD.');
      guestPhone.focus();
      return;
    }

    const payload = {
      timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      nome: guestName.value.trim(),
      presenca: selectedAttendance.value === 'Sim' ? 'Confirmado' : 'Não comparecerá',
      restricaoAlimentar: selectedAttendance.value === 'Sim' 
        ? (dietarySelect.value === 'Outra' ? `Outra: ${dietaryDetail.value.trim()}` : dietarySelect.value)
        : 'N/A',
      whatsapp: guestPhone.value.trim(),
      mensagem: guestMessage.value.trim() || 'Sem mensagem'
    };

    // Estado de Carregamento
    setLoading(true);

    try {
      if (GOOGLE_SHEETS_ENDPOINT && GOOGLE_SHEETS_ENDPOINT.trim() !== '') {
        // Envio real para Google Apps Script
        await fetch(GOOGLE_SHEETS_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
      } else {
        // Modo demonstração / Gravação Local
        console.log('Dados salvos (Modo Demonstração):', payload);
        const existingResponses = JSON.parse(localStorage.getItem('nina_rsvp_responses') || '[]');
        existingResponses.push(payload);
        localStorage.setItem('nina_rsvp_responses', JSON.stringify(existingResponses));
        await new Promise(r => setTimeout(r, 600));
      }

      // Exibir Tela de Sucesso
      showSuccess(payload);
    } catch (err) {
      console.error('Erro ao registrar resposta:', err);
      showError('Ocorreu um erro ao registrar. Por favor, tente novamente ou entre em contato pelo WhatsApp.');
    } finally {
      setLoading(false);
    }
  });

  // 5. Exibição da Tela de Sucesso
  function showSuccess(data) {
    form.classList.add('hidden');
    successCard.classList.remove('hidden');

    const firstName = data.nome.split(' ')[0];

    if (data.presenca === 'Confirmado') {
      successHeading.textContent = 'Presença Confirmada com Honra! ✨';
      successBody.textContent = `É uma imensa honra registrar vossa presença, ${firstName}! O Diamante Nina e sua família aguardam você para desfrutarmos juntas este jantar memorável e acolhedor.`;
      addToCalendarBtn.classList.remove('hidden');
    } else {
      successHeading.textContent = 'Vosso Recado Foi Registrado 💌';
      successBody.textContent = `Agradecemos por nos avisar, ${firstName}. Lamentamos profundamente sua ausência nesta data, mas guardamos com carinho seus votos para a nossa debutante.`;
      addToCalendarBtn.classList.add('hidden');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 6. Botão de Editar Resposta
  editResponseBtn.addEventListener('click', () => {
    successCard.classList.add('hidden');
    form.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 7. Adicionar à Agenda Real (.ICS / Google Calendar)
  addToCalendarBtn.addEventListener('click', () => {
    const title = 'Jantar Intimista • XV de Nina';
    const description = 'Querido e gentil leitor: Uma noite especial e intimista para estarmos juntas ao redor de um jantar acolhedor e boa música.';
    const location = 'Local informado no convite';
    const startDate = '20260918T223000Z'; // 18/09/2026 19:30 BRT = 22:30 UTC
    const endDate = '20260919T023000Z';   // 18/09/2026 23:30 BRT = 02:30 UTC

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
      downloadICS(title, description, location);
    } else {
      const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
      window.open(googleCalUrl, '_blank');
    }
  });

  function downloadICS(title, description, location) {
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//XV da Nina Bridgerton//RSVP//PT',
      'BEGIN:VEVENT',
      'UID:' + Date.now() + '@xvdnina.com',
      'DTSTAMP:20260817T000000Z',
      'DTSTART:20260918T193000',
      'DTEND:20260918T233000',
      'SUMMARY:' + title,
      'DESCRIPTION:' + description,
      'LOCATION:' + location,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'XV_da_Nina_Bridgerton_18_09_2026.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Utilitários de UI
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
      btnText.textContent = 'Registrando nas Crônicas...';
      btnIcon.classList.add('hidden');
      spinner.classList.remove('hidden');
    } else {
      btnText.textContent = 'Confirmar na Lista da Sociedade';
      btnIcon.classList.remove('hidden');
      spinner.classList.add('hidden');
    }
  }

  function showError(msg) {
    formError.textContent = msg;
    formError.classList.remove('hidden');
  }
});
