const assert = require('node:assert/strict');
const handler = require('../api/reservas');
const { getValidSlots } = require('../api/_reservaRules');

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

  const saturdaySlots = getValidSlots('2026-06-20', beforeCutoff);
  assert.ok(saturdaySlots.includes('19:00'));
  assert.ok(!saturdaySlots.includes('19:30'));
  assert.ok(!saturdaySlots.includes('20:00'));

  const afterLimitTime = handler.validateReservation({
    nome: 'Teste Garden',
    whatsapp: '(19) 99999-9999',
    data: '2026-06-20',
    horario: '19:30',
    pessoas: 2,
    tracking: {}
  }, beforeCutoff);

  assert.match(afterLimitTime.error, /horário dentro do funcionamento/i);

  const closedDateSlots = getValidSlots('2026-06-12', beforeCutoff);
  assert.deepEqual(closedDateSlots, []);

  const closedDateReservation = handler.validateReservation({
    nome: 'Teste Garden',
    whatsapp: '(19) 99999-9999',
    data: '2026-06-12',
    horario: '18:00',
    pessoas: 2,
    tracking: {}
  }, beforeCutoff);

  assert.match(closedDateReservation.error, /horário dentro do funcionamento/i);

  const todayClosedSlots = getValidSlots('2026-06-13', beforeCutoff);
  assert.deepEqual(todayClosedSlots, []);

  const todayClosedReservation = handler.validateReservation({
    nome: 'Teste Garden',
    whatsapp: '(19) 99999-9999',
    data: '2026-06-13',
    horario: '18:00',
    pessoas: 2,
    tracking: {}
  }, beforeCutoff);

  assert.match(todayClosedReservation.error, /horário dentro do funcionamento/i);

  const requestedClosedSlots = getValidSlots('2026-06-19', beforeCutoff);
  assert.deepEqual(requestedClosedSlots, []);

  const requestedClosedReservation = handler.validateReservation({
    nome: 'Teste Garden',
    whatsapp: '(19) 99999-9999',
    data: '2026-06-19',
    horario: '18:00',
    pessoas: 2,
    tracking: {}
  }, beforeCutoff);

  assert.match(requestedClosedReservation.error, /horário dentro do funcionamento/i);

  const missingPixAck = handler.validateReservation({
    nome: 'Grupo Garden',
    whatsapp: '(19) 99999-9999',
    data: '2026-06-20',
    horario: '11:00',
    pessoas: 21,
    pixGuaranteeAcknowledged: false,
    tracking: {}
  }, beforeCutoff);

  assert.match(missingPixAck.error, /Pix de garantia/i);

  const afterCutoffAllowed = handler.validateReservation({
    nome: 'Teste Garden',
    whatsapp: '(19) 99999-9999',
    data: '2026-06-20',
    horario: '11:00',
    pessoas: 2,
    tracking: {}
  }, afterCutoff);

  assert.equal(afterCutoffAllowed.error, undefined);
  assert.equal(afterCutoffAllowed.data.horario, '11:00');

  console.log('API reservation validation tests passed.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
