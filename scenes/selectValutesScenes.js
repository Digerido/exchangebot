const { Markup, Scenes, Composer } = require('telegraf');
const { giveValutesKeyboard, getValutesKeyboard } = require('../utils/keyboard/valutes-keyboard')
const { valutes } = require('../services/index');


const selectGiveValute = new Composer()

selectGiveValute.command('start', async (ctx) => {
  try {
    const giveValutes = await giveValutesKeyboard()
    ctx.wizard.state.data = {};
    await ctx.reply(ctx.i18n.t('selectgivevalute'), giveValutes)
  } catch (error) {
    console.error('Error:', error);
  }
});


selectGiveValute.on("callback_query", async (ctx) => {
  const chosenValute = ctx.callbackQuery.data;
  const valutesList = await valutes();
  ctx.wizard.state.data.giveValute = valutesList.find(valute => valute.bestchangeKey === chosenValute);
  const giveValute = ctx.scene.state.data.giveValute;
  await ctx.reply(`Вы выбрали вариант: ${giveValute.title}`);
  const getValutes = await getValutesKeyboard()
  await ctx.reply(ctx.i18n.t('selectgetvalute'), getValutes)
  return ctx.wizard.next()
});


const selectGetValute = new Composer()

selectGetValute.on("callback_query", async (ctx) => {
  const chosenValute = ctx.callbackQuery.data;
  const valutesList = await valutes();
  ctx.wizard.state.data.getValute = valutesList.find(valute => valute.bestchangeKey === chosenValute);
  const getValute = ctx.scene.state.data.giveValute;
  await ctx.reply(`Вы выбрали вариант: ${getValute.title}`);
});


const selectValutesScenes = new Scenes.WizardScene(
  "selectValutes", selectGiveValute, selectGetValute  // Our wizard scene id, which we will use to enter the scene
);

module.exports = selectValutesScenes;
