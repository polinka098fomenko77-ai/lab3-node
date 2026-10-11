import { Command, InvalidArgumentError } from 'commander';
import { readFileSync } from 'node:fs';

const program = new Command();

program
  .name('mc')
  .description('Утиліта для перегляду даних персонажа гри Minecraft')
  .version('1.0.0')
  .option('-f, --file <path>', 'шлях до JSON-файлу', 'data.json');

const STAT_LABELS = {
  health: "здоров'я",
  hunger: 'ситість',
  armor: 'броня',
  experience: 'досвід',
};

function parsePositiveInt(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new InvalidArgumentError('Має бути додатне ціле число.');
  }
  return n;
}

function loadData() {
  const path = program.opts().file;
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (e) {
    program.error(e.code === 'ENOENT'
      ? `Файл "${path}" не знайдено.`
      : `Не вдалося прочитати файл "${path}".`);
  }
  try {
    return JSON.parse(text);
  } catch {
    program.error(`Файл "${path}" містить некоректний JSON.`);
  }
}

function findById(list, id, label) {
  const item = list.find(x => x.id === id);
  if (!item) program.error(`${label} з id ${id} не знайдено.`);
  return item;
}

program.parse();
