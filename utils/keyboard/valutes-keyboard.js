const { valutes, crossRatesList } = require('../../services/index');
const { Markup } = require('telegraf');

const createKeyboard = async (filterFunc) => {
  const valutesList = await valutes();
  const filteredValutes = valutesList.filter(filterFunc)
    .map(valute => [{ text: valute.title, callback_data: valute.bestchangeKey }]);

  return Markup.inlineKeyboard(filteredValutes, { columns: 2 }).oneTime().resize();
};

const giveValutesKeyboard = async () => {
  return createKeyboard(valute => valute.bestchangeKey === 'QWRUB');
};

const getValutesKeyboard = async () => {
  const response = await crossRatesList();
  let crossRates = response.filter((cr) => {
    return (cr.isActive === true &&
      cr.from && cr.from.bestchangeKey === 'QWRUB' &&
      cr.to && cr.to.categories.includes('crypto')
    );
  });
  let bestchangeKeys = crossRates.map((cr) => {
    return cr.to.bestchangeKey;
  });
  console.log(bestchangeKeys)
  const valutesList = await valutes();
  const filteredValutes = valutesList.filter(valute =>
    valute.isGet === true &&
    valute.isCash === false &&
    bestchangeKeys.includes(valute.bestchangeKey) &&
    valute.bestchangeKey != 'XRP'
  ).map(valute => [{ text: valute.title, callback_data: valute.bestchangeKey }]);
  return Markup.inlineKeyboard(filteredValutes, { columns: 2 }).oneTime().resize();
};

const selectedValutesKeyboard = (ctx) => {
  return Markup.inlineKeyboard(
    [[{ text: ctx.wizard.state.data.giveValute.title, callback_data: ctx.wizard.state.data.giveValute.bestchangeKey }],
    [{ text: ctx.wizard.state.data.getValute.title, callback_data: ctx.wizard.state.data.getValute.bestchangeKey }]]);
};




module.exports = { giveValutesKeyboard, getValutesKeyboard, selectedValutesKeyboard };
