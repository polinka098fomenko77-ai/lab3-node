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

program
  .command('list')
  .description('показати список предметів інвентарю')
  .option('-l, --limit <n>', 'максимальна кількість записів', parsePositiveInt)
  .action((options) => {
    const { inventory } = loadData();
    const shown = options.limit ? inventory.slice(0, options.limit) : inventory;
    shown.forEach(i => console.log(`${i.id}. ${i.name} (${i.purpose})`));
  });

program
  .command('item')
  .description('показати предмет інвентарю повністю')
  .argument('<id>', 'ідентифікатор предмета', parsePositiveInt)
  .action((id) => {
    console.log(JSON.stringify(findById(loadData().inventory, id, 'предмет'), null, 2));
  });

program
  .command('field')
  .description('показати поле предмета (напр. stats.damage або stats.enchantments.0)')
  .argument('<id>', 'ідентифікатор предмета', parsePositiveInt)
  .argument('<path>', 'шлях до поля через крапку')
  .action((id, path) => {
    let value = findById(loadData().inventory, id, 'предмет');
    for (const key of path.split('.')) {
      if (value === null || typeof value !== 'object' || !Object.hasOwn(value, key)) {
        program.error(`поле "${path}" відсутнє у предмета ${id}.`);
      }
      value = value[key];
    }
    console.log(value === null
      ? 'null (поле є, але значення порожнє)'
      : JSON.stringify(value));
  });

program
  .command('character')
  .description('показати рівень і характеристики персонажа')
  .action(() => {
    const { name, class: profession, level, stats } = loadData();
    console.log(`${name} (${profession}), рівень ${level}`);
    for (const [key, value] of Object.entries(stats)) {
      console.log(`  ${STAT_LABELS[key] ?? key}: ${value}`);
    }
  });

program
  .command('inventory')
  .description('інвентар з відбором за призначенням та екіпіруванням')
  .option('-p, --purpose <type>', 'призначення: зброя, інструмент, броня, їжа, блок')
  .option('-e, --equipped', 'показати лише екіпіровані предмети')
  .action((options) => {
    const result = loadData().inventory.filter(i =>
      (!options.purpose || i.purpose === options.purpose) &&
      (!options.equipped || i.equipped === true));
    if (result.length === 0) {
      console.log('предметів за вказаними умовами не знайдено.');
      return;
    }
    result.forEach(i => {
      const mark = i.equipped ? ' (екіпіровано)' : '';
      const enchants = i.stats?.enchantments?.length
        ? `, чари: ${i.stats.enchantments.join(', ')}` : '';
      console.log(`${i.id}. ${i.name} [${i.purpose}]${mark}${enchants}`);
    });
  });

program
  .command('skill')
  .description('показати відомості про навичку')
  .argument('<name>', 'назва навички (або її частина)')
  .action((name) => {
    const q = name.toLowerCase();
    const skill = loadData().skills.find(s => s.name.toLowerCase().includes(q));
    if (!skill) program.error(`навичку "${name}" не знайдено.`);
    console.log(JSON.stringify(skill, null, 2));
  });

program.parse();
