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
  return createKeyboard(valute => valute.isGet === true);
};

const selectedValutesKeyboard = (ctx) => {
    console.log('klava = ',ctx.wizard.state.data.getValute.title)
    return Markup.inlineKeyboard(
        [[{ text: ctx.wizard.state.data.giveValute.title, callback_data: 'give' }],
        [{ text: ctx.wizard.state.data.getValute.title, callback_data: 'get'}]]);
  };
  



module.exports = { giveValutesKeyboard, getValutesKeyboard, selectedValutesKeyboard };
