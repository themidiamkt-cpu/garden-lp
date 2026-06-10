const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const output = path.join(root, 'public');

function copyEntry(source, destination) {
  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    fs.readdirSync(source).forEach(entry => {
      copyEntry(path.join(source, entry), path.join(destination, entry));
    });
    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

['index.html', 'img', 'reserva-confirmada'].forEach(entry => {
  copyEntry(path.join(root, entry), path.join(output, entry));
});

console.log('Vercel output prepared in public/.');
