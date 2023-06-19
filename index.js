import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();
// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN;
const getBaseUrl = 'http://127.0.0.1:3000'; // Замените на ваш базовый URL
const authorizationToken = process.env.AUTH_TOKEN
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Функция для отправки сообщения с кнопкой "Создать заявку"
function sendWelcomeMessage(chatId) {
  bot.sendMessage(chatId, 'Приветствую. Я могу совершить обмен криптовалюты в Telegram. Пожалуйста напишите тикер валюты, которую вы отдаете: 1)QIWIRUB 2)BTC 3)USDTTRC20');
}

// Функция для отправки сообщения с кнопкой "Создать заявку"


async function sendGetValute(chatId) {

  const result = await fetch(`${getBaseUrl}/api/public/valutes`);
  const data = await result.json();
  
  console.log('HEY = ', data.result[0].key);
  
  const valuteList = data.result.map(valute => valute.key);
  const formattedList = valuteList.join('\n');
  
  bot.sendMessage(chatId, `Доступные валюты:\n${formattedList}`);
  bot.sendMessage(chatId, 'Теперь напишите тикер валюты, которую хотите получить.');
  }

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (messageText === '/start') {
    // Send the welcome message with the initial options
    sendWelcomeMessage(chatId);
  } else if (messageText === 'QIWIRUB') {
    // Handle the position selection
    try {

      //// Make a request to /example endpoint with the selected position
      //const response = await fetch(`${getBaseUrl}/api//apiv1/private/rates`, {
      //  headers: {
      //    'authorization-token': `${authorizationToken}`
      //  }
      //}).then(() => { sendGetValute(chatId) });;
//
      //const responseData = response.data;
      // Process the response data and send a message
      sendGetValute(chatId)
    } catch (error) {
      console.error('Error:', error);
    }
  }
  else if (messageText === 'BTC' || messageText === 'USDTTRC') {
    // Handle the position selection
    bot.sendMessage(chatId, 'Position selected: ' + messageText);
    try {
      // Make a request to /example endpoint with the selected position
      const response = await fetch(`${getBaseUrl}/api/apiv1/private/rates`, {
        headers: {
          'authorization-token': `${authorizationToken}`
        }
      })

      ///api/public/valutes
      const responseData = response.data;
      // Process the response data and send a message
      bot.sendMessage(chatId, 'Response from /example endpoint: ' + responseData);
    } catch (error) {
      console.error('Error:', error);
    }
  }
});
