const { Markup } = require('telegraf');

const confirmOrderKeyboard = Markup.inlineKeyboard(
    [[{ text: 'Я оплатил', callback_data: 'confirm' }],
    [{ text: 'Отменить', callback_data: 'cancel' }]]);


module.exports = confirmOrderKeyboard;