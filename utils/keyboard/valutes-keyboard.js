const { valutes } = require('../../services/index');
const { Markup } = require('telegraf');

const giveValutesKeyboard = async () => {
    const valutesList = await valutes();
    const giveValutes = valutesList.filter(valute => valute.isGive === true)
        .map(valute => [{ text: valute.title, callback_data: valute.bestchangeKey }]);
    const giveValutesKeyboard = Markup.inlineKeyboard(giveValutes, { columns: 2 }).oneTime().resize();
    return giveValutesKeyboard;
};

const getValutesKeyboard = async () => {
    const valutesList = await valutes();
    const getValutes = valutesList.filter(valute => valute.isGet === true)
        .map(valute => [{ text: valute.title, callback_data: valute.bestchangeKey }]);
    const getValutesKeyboard = Markup.inlineKeyboard(getValutes, { columns: 2 });

    return getValutesKeyboard;
};

module.exports = { giveValutesKeyboard, getValutesKeyboard };
