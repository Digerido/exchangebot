const { valutes, crossRatesList } = require('../../services/index');
const { Markup } = require('telegraf');

const createValuteButtons = (valutesList, filterFunc) =>
  valutesList
    .filter(filterFunc)
    .map(valute => [{ text: valute.title, callback_data: valute.bestchangeKey }]);

const createKeyboard = (buttons) =>
  Markup.inlineKeyboard(buttons, { columns: 2 }).oneTime().resize();

const giveValutesKeyboard = async () => {
  const valutesList = await valutes();
  const buttons = createValuteButtons(valutesList, valute => valute.bestchangeKey === 'QWRUB');
  return createKeyboard(buttons);
};

const getValutesKeyboard = async () => {
  const response = await crossRatesList();
  const bestchangeKeys = response
    .filter(cr => cr.isActive === true && cr.from && cr.from.bestchangeKey === 'QWRUB')
    .map(cr => cr.to.bestchangeKey);

  const valutesList = await valutes();
  const buttons = createValuteButtons(
    valutesList, 
    valute => valute.isGet === true && valute.isCash === false && bestchangeKeys.includes(valute.bestchangeKey));

  return createKeyboard(buttons);
};

const selectedValutesKeyboard = (ctx) => {
  const buttons = [
    [{ text: ctx.wizard.state.data.giveValute.title, callback_data: ctx.wizard.state.data.giveValute.bestchangeKey }],
    [{ text: ctx.wizard.state.data.getValute.title, callback_data: ctx.wizard.state.data.getValute.bestchangeKey }]
  ];

  return createKeyboard(buttons);
};

module.exports = { giveValutesKeyboard, getValutesKeyboard, selectedValutesKeyboard };
