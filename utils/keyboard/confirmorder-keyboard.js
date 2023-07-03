const { Markup } = require('telegraf');

const confirmOrderKeyboard = Markup.inlineKeyboard(
    [[{ text: 'Отменить', callback_data: 'cancel' }]]);


module.exports = confirmOrderKeyboard;