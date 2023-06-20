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
const Storage = new Map();

// 1)При /start отдаем валюту
async function giveValute(chatId) {
  const valuteList = data.result.filter(valute => valute.isGive === true)
    .map(valute => ([{ text: valute.title, callback_data: valute.bestchangeKey}]));
    Storage.set(chatId, 'isGive')
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
    Storage.set(chatId, 'isGet')
  const dropdownValuteList = {
    reply_markup: {
      inline_keyboard: valuteList
    }
  };
  bot.sendMessage(chatId, 'Теперь напишите тикер валюты, которую хотите получить:', dropdownValuteList);
}

// Listen for any kind of message. There are different kinds of messages.
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    giveValute(chatId)
  } catch (error) {
    console.error('Error:', error);
  }
})

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const typeValute = Storage.get(chatId)
  let choosenValute = query.data;
  console.log('typeValute=',typeValute.trim(),'choosenValute = ', choosenValute)
  if(typeValute === 'isGive'){ 
    console.log('start pol')
    bot.sendMessage(chatId, `Вы выбрали вариант: ${choosenValute}`);
    getValute(chatId)
  }
  else if(typeValute === 'isGet'){
    bot.sendMessage(chatId, `Hello freak bitches! Вы выбрали вариант: ${choosenValute}`);
  }
});
