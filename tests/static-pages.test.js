const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const confirmation = fs.readFileSync(path.join(root, 'reserva-confirmada', 'index.html'), 'utf8');

assert.match(index, /id="reserva-form"/);
assert.match(index, /fetch\('\/api\/reservas'/);
assert.match(index, /AW-721017465/);
assert.match(index, /1221948576112799/);
assert.match(index, /facebook-domain-verification" content="8o9oiql3caamfbcd6g1gr446gaq02t/);

assert.match(confirmation, /noindex, nofollow/);
assert.match(confirmation, /AW-721017465\/JK0rCNadwLwcEPm059cC/);
assert.match(confirmation, /fbq\('trackSingle', '1221948576112799', 'Lead'/);
assert.match(confirmation, /content_name: 'Formulario Garden'/);
assert.match(confirmation, /ev=Lead/);
assert.match(confirmation, /Reserva enviada com sucesso/);

console.log('Static page checks passed.');
