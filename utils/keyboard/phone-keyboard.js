const { Markup } = require('telegraf');

const phoneKeyboard = Markup.keyboard([
    [{ text: 'Отправить номер телефона', request_contact: true }]
  ]).resize().oneTime();

module.exports = phoneKeyboard;
