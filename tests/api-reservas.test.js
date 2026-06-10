const assert = require('node:assert/strict');
const handler = require('../api/reservas');

function nextDateForDay(targetDay) {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  while (date.getDay() !== targetDay) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString().slice(0, 10);
}

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(payload) {
      this.body = payload;
    }
  };
}

async function postReservation(body) {
  const req = { method: 'POST', body };
  const res = createResponse();
  await handler(req, res);
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body)
  };
}

global.fetch = async () => {
  throw new Error('Tests must not call the real webhook.');
};

(async () => {
  const monday = nextDateForDay(1);
  const outsideHours = await postReservation({
    nome: 'Teste Garden',
    whatsapp: '(19) 99999-9999',
    data: monday,
    horario: '16:00',
    pessoas: 2,
    tracking: {}
  });

  assert.equal(outsideHours.statusCode, 400);
  assert.match(outsideHours.body.error, /horário dentro do funcionamento/i);

  const saturday = nextDateForDay(6);
  const missingPixAck = await postReservation({
    nome: 'Grupo Garden',
    whatsapp: '(19) 99999-9999',
    data: saturday,
    horario: '11:00',
    pessoas: 21,
    pixGuaranteeAcknowledged: false,
    tracking: {}
  });

  assert.equal(missingPixAck.statusCode, 400);
  assert.match(missingPixAck.body.error, /Pix de garantia/i);

  console.log('API reservation validation tests passed.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
