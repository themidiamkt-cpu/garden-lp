const assert = require('node:assert/strict');
const handler = require('../api/reservas');

(async () => {
  const beforeCutoff = new Date('2026-06-11T21:00:00.000Z');
  const afterCutoff = new Date('2026-06-11T22:01:00.000Z');

  const outsideHours = handler.validateReservation({
    nome: 'Teste Garden',
    whatsapp: '(19) 99999-9999',
    data: '2026-06-15',
    horario: '16:00',
    pessoas: 2,
    tracking: {}
  }, beforeCutoff);

  assert.match(outsideHours.error, /horário dentro do funcionamento/i);

  const missingPixAck = handler.validateReservation({
    nome: 'Grupo Garden',
    whatsapp: '(19) 99999-9999',
    data: '2026-06-13',
    horario: '11:00',
    pessoas: 21,
    pixGuaranteeAcknowledged: false,
    tracking: {}
  }, beforeCutoff);

  assert.match(missingPixAck.error, /Pix de garantia/i);

  const cutoffBlocked = handler.validateReservation({
    nome: 'Teste Garden',
    whatsapp: '(19) 99999-9999',
    data: '2026-06-13',
    horario: '11:00',
    pessoas: 2,
    tracking: {}
  }, afterCutoff);

  assert.match(cutoffBlocked.error, /somente até 19:00/i);

  console.log('API reservation validation tests passed.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
