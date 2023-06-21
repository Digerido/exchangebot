import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();
// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN;
const getBaseUrl = process.env.GETBASEURL; // Замените на ваш базовый URL
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });
const valutes = await fetch(`${getBaseUrl}/api/public/valutes`).then(res => res.json());
const crossRatesList = await fetch(`${getBaseUrl}/api/public/cross-rates`).then(res => res.json());
let choosenValuteStatus;
const crossRates = crossRatesList.result.filter((cr) => {
  return cr.isDisabled === false;
});
//const disabledCrossRates = crossRatesList.filter((cr) => {
//  return cr.isDisabled === true;
//});
//Объекты валют
let giveValute;
let getValute;
// для подсчитанные суммы валют
let giveAmount;
let getAmount;

const directExchangeRate = () => {
  if (!giveValute || !getValute) return null;
  const crossRate = crossRates.find((cr) => {
    return (
      cr.from.bestchangeKey === giveValute.bestchangeKey &&
      cr.to.bestchangeKey === getValute.bestchangeKey
    );
  });
  console.log('crossRate = ',crossRate)
  if (crossRate) return 1 / crossRate.out;
  console.log('calc = ',(getValute.percentGet * getValute.course) /
  (giveValute.percentGive * giveValute.course))
  return (
    getValute &&
    giveValute &&
    (getValute.percentGet * getValute.course) /
    (giveValute.percentGive * giveValute.course)
  );
};

const getFixFactor = (valute) => {
  return ["RUB", "USDT"].includes(valute?.key) ? 2 : 5;
};


const calculateGetAmount = () => {
  return parseFloat(
    (giveAmount / directExchangeRate()).toFixed(
      getFixFactor(getValute)
    )
  );
};


function setGiveAmount(value) {    
  const fixedValue = (+value).toFixed(getFixFactor(giveValute));
  giveAmount = parseFloat(fixedValue);
  getAmount = calculateGetAmount();
}

// 1)При /start отдаем валюту
async function selectGiveValute(chatId) {
  const valuteList = valutes.result.filter(valute => valute.isGive === true)
    .map(valute => ([{ text: valute.title, callback_data: valute.bestchangeKey }]));
  choosenValuteStatus = 'isGive';
  const dropdownValuteList = {
    reply_markup: JSON.stringify({
      inline_keyboard: valuteList
    })
  };
  bot.sendMessage(chatId, 'Приветствую. Я могу совершить обмен криптовалюты в Telegram. Пожалуйста напишите тикер валюты, которую вы отдаете: ', dropdownValuteList);
}

// 2)Получаем валюту
async function selectGetValute(chatId) {
  const valuteList = valutes.result.filter(valute => valute.isGet === true)
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
      selectGiveValute(chatId)
    } catch (error) {
      console.error('Error:', error);
    }
  }
  else {
    const userAmount = parseFloat(msg.text.replace(',', '.'))
    console.log(userAmount)
    if (giveValute?.minGive > userAmount) {
      bot.sendMessage(chatId, 'Введенное значение меньше допустимого');
    }
    else {
      setGiveAmount(userAmount)
      bot.sendMessage(chatId, `Ваш обмен: ${giveAmount} ${giveValute?.key} к отправке ${getAmount} ${getValute?.key} к получению. Текущий курс ${giveValute?.course}/${getValute?.course}. Курс сделки будет зафиксирован в момент подтверждения отправки средств. Если подтверждаете ответьте - да`);
    }
  }
})

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  let choosenValute = query.data;
  if (choosenValuteStatus === 'isGive') {
    console.log(choosenValuteStatus)
    giveValute = valutes.result.find(valute => valute.bestchangeKey === choosenValute)

    bot.sendMessage(chatId, `Вы выбрали вариант: ${giveValute.title}`);
    selectGetValute(chatId)
    choosenValuteStatus = 'isGet'
  }
  else if (choosenValuteStatus === 'isGet') {
    getValute = valutes.result.find(valute => valute.bestchangeKey === choosenValute)
    bot.sendMessage(chatId, `Вы выбрали направление: ${giveValute.title + ' -> ' + getValute.title}. Минимальная сумма к обмену ${giveValute.minGive + ' ' + giveValute.key} или ${getValute.minGive + ' ' + getValute.key} напишите сумму к обмену`);
  }
});
