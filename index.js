import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();
// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN;
const getBaseUrl = 'http://127.0.0.1:3000'; // Замените на ваш базовый URL
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });
const result = await fetch(`${getBaseUrl}/api/public/valutes`);
const data = await result.json();
const valuteType = new Map();
const giveValuteValue = new Map();
const getValuteValue = new Map();
let giveValuteKey;
let getValuteKey;

// 1)При /start отдаем валюту
async function giveValute(chatId) {
  const valuteList = data.result.filter(valute => valute.isGive === true)
    .map(valute => ([{ text: valute.title, callback_data: valute.bestchangeKey }]));
  valuteType.set(chatId, 'isGive')
  const dropdownValuteList = {
    reply_markup: JSON.stringify({
      inline_keyboard: valuteList
    })
  };
  bot.sendMessage(chatId, 'Приветствую. Я могу совершить обмен криптовалюты в Telegram. Пожалуйста напишите тикер валюты, которую вы отдаете: ', dropdownValuteList);
}

// 2)Получаем валюту
async function getValute(chatId) {
  const valuteList = data.result.filter(valute => valute.isGet === true)
    .map(valute => ([{ text: valute.title, callback_data: valute.bestchangeKey }]));
  const dropdownValuteList = {
    reply_markup: {
      inline_keyboard: valuteList
    }
  };
  bot.sendMessage(chatId, 'Теперь напишите тикер валюты, которую хотите получить:', dropdownValuteList);
}

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (msg.text === '/start') {
    try {
      giveValute(chatId)
    } catch (error) {
      console.error('Error:', error);
    }
  }
  else{
    const userAmount = parseFloat(msg.text.replace(',', '.'))
    console.log(userAmount)
    const give = giveValuteValue.get(chatId);
    const get = getValuteValue.get(chatId);
    if(give?.minGive > userAmount){
      bot.sendMessage(chatId, 'Введенное значение меньше допустимого');
    }
    else{
      bot.sendMessage(chatId, 'Приятно было познакомиться!');
      
    }
    //высчитать курс
    //else if(get[0].minGive > userAmount){
    //  bot.sendMessage(chatId, 'Введенное значение меньше допустимого');
    //}
  }
})

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const valute = valuteType.get(chatId)
  let choosenValute = query.data;
  if (valute === 'isGive') {
    giveValuteKey = data.result.find(valute => valute.bestchangeKey === choosenValute)
    bot.sendMessage(chatId, `Вы выбрали вариант хей: ${giveValuteKey.title}`);
    getValute(chatId)
    valuteType.set(chatId, 'isGet')
  }
  else if (valute === 'isGet') {
    getValuteKey = data.result.find(valute => valute.bestchangeKey === choosenValute)
    console.log('getValuteKey =',getValuteKey.title)
    bot.sendMessage(chatId, `Вы выбрали направление: ${giveValuteKey.title + ' -> ' + getValuteKey.title}. Минимальная сумма к обмену ${giveValuteKey.minGive + ' ' + giveValuteKey.key} или ${getValuteKey.minGive + ' ' + getValuteKey.key} напишите сумму к обмену`);
    valuteType.set(chatId, 'isReadyToSend');
    giveValuteValue.set(chatId, giveValuteKey);
    getValuteValue.set(chatId, getValuteKey);
  }

});
