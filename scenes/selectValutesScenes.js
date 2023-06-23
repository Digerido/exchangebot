const { Markup, Scenes } = require('telegraf');
const { Composer } = require('telegraf')
const start = new Composer()
const { valutes } = require('../services/index.js');

start.command('start', async (ctx) => {
  try {
    ctx.session.valutes = await valutes()
    await selectGiveValute(ctx)
  } catch (error) {
    console.error('Error:', error);
  }
});

async function selectGiveValute(ctx) {
  console.log(ctx)
  ctx.session.giveValuteList = ctx.session.valutes.filter(valute => valute.isGive === true)
    .map(valute => [{ text: valute.title, callback_data: valute.bestchangeKey }]);
  const dropdownValuteList = Markup.inlineKeyboard(ctx.session.giveValuteList, {columns:2});
  await ctx.reply(ctx.i18n.t('welcome'), dropdownValuteList);
}

const selectValutesScenes = new Scenes.WizardScene(
  "selectValutes", start // Our wizard scene id, which we will use to enter the scene
);

module.exports = selectValutesScenes;
