const { isPastReservationCutoff, isValidSlot } = require('./_reservaRules');

const WEBHOOK_URL = 'https://automacao2.themidiamarketing.com.br/webhook/garden-reservas';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') return Promise.resolve(JSON.parse(req.body || '{}'));

  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Payload muito grande.'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function cleanText(value) {
  return String(value || '').trim();
}

function cleanTracking(tracking = {}) {
  return {
    pageUrl: cleanText(tracking.pageUrl),
    referrer: cleanText(tracking.referrer),
    utm_source: cleanText(tracking.utm_source),
    utm_medium: cleanText(tracking.utm_medium),
    utm_campaign: cleanText(tracking.utm_campaign),
    utm_term: cleanText(tracking.utm_term),
    utm_content: cleanText(tracking.utm_content)
  };
}

function validateReservation(body, now = new Date()) {
  const nome = cleanText(body.nome);
  const whatsapp = cleanText(body.whatsapp);
  const data = cleanText(body.data);
  const horario = cleanText(body.horario);
  const pessoas = Number(body.pessoas);
  const pixGuaranteeRequired = pessoas > 20;
  const pixGuaranteeAcknowledged = body.pixGuaranteeAcknowledged === true;

  if (nome.length < 2) return { error: 'Informe seu nome.' };
  if (whatsapp.length < 8) return { error: 'Informe um WhatsApp válido.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { error: 'Informe uma data válida.' };
  if (!/^\d{2}:\d{2}$/.test(horario)) return { error: 'Informe um horário válido.' };
  if (!Number.isInteger(pessoas) || pessoas < 1 || pessoas > 200) {
    return { error: 'Informe um número válido de pessoas.' };
  }
  if (isPastReservationCutoff(now)) {
    return { error: 'Reservas pelo site ficam disponíveis somente até 19:30.' };
  }
  if (!isValidSlot(data, horario, now)) {
    return { error: 'Escolha um horário dentro do funcionamento do Garden.' };
  }
  if (pixGuaranteeRequired && !pixGuaranteeAcknowledged) {
    return { error: 'Confirme a ciência sobre o Pix de garantia para reservas acima de 20 pessoas.' };
  }

  return {
    data: {
      nome,
      whatsapp,
      data,
      horario,
      pessoas,
      pixGuaranteeRequired,
      pixGuaranteeAcknowledged,
      tracking: cleanTracking(body.tracking)
    }
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Método não permitido.' });
  }

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    return sendJson(res, 400, { error: 'JSON inválido.' });
  }

  const validation = validateReservation(body);
  if (validation.error) {
    return sendJson(res, 400, { error: validation.error });
  }

  let webhookResponse;
  try {
    webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'garden-site',
        submittedAt: new Date().toISOString(),
        ...validation.data
      })
    });
  } catch (error) {
    return sendJson(res, 502, { error: 'Não foi possível enviar a reserva. Tente novamente em instantes.' });
  }

  if (!webhookResponse.ok) {
    return sendJson(res, 502, { error: 'Não foi possível enviar a reserva. Tente novamente em instantes.' });
  }

  return sendJson(res, 200, { ok: true });
};

module.exports.validateReservation = validateReservation;
