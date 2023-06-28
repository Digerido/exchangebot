const { valutes } = require('../../services/index');
const { Markup } = require('telegraf');

const createKeyboard = async (filterFunc) => {
  const valutesList = await valutes();
  const filteredValutes = valutesList.filter(filterFunc)
      .map(valute => [{ text: valute.title, callback_data: valute.bestchangeKey }]);
  
  return Markup.inlineKeyboard(filteredValutes, { columns: 2 }).oneTime().resize();  
};

const giveValutesKeyboard = async () => {
  return createKeyboard(valute => valute.bestchangeKey === 'BTC');
};

const getValutesKeyboard = async () => {
  return createKeyboard(valute => valute.isGet === true && valute.isCash === false);
};

const selectedValutesKeyboard = (ctx) => {
    return Markup.inlineKeyboard(
        [[{ text: ctx.wizard.state.data.giveValute.title, callback_data: ctx.wizard.state.data.giveValute.bestchangeKey }],
        [{ text: ctx.wizard.state.data.getValute.title, callback_data: ctx.wizard.state.data.getValute.bestchangeKey}]]);
  };
  



module.exports = { giveValutesKeyboard, getValutesKeyboard, selectedValutesKeyboard };
