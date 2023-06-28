const { Markup } = require('telegraf');

const prepareToPayKeyboard = Markup.inlineKeyboard(
    [[{ text: 'Да', callback_data: 'yes' }],
    [{ text: 'Назад', callback_data: 'back' }]]);

  module.exports = prepareToPayKeyboard;