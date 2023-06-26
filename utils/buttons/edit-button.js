
const { Markup } = require('telegraf');
const editButton = Markup.inlineKeyboard([
    [{ text: 'Редактировать', callback_data: 'edit' }]]);


module.exports = editButton;