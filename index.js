const { Extra, Markup, Scenes,Telegraf, session } = require('telegraf');
const dotenv = require('dotenv');
const selectValutesScenes = require('./scenes/selectValutesScenes');
//const LocalSession = require('telegraf-session-local');
const TelegrafI18n = require('telegraf-i18n')

dotenv.config();

const i18n = new TelegrafI18n({
  defaultLanguage: 'ru',
  allowMissing: false, // Default true
  directory: './locales'
})

const token = process.env.BOT_TOKEN;
const bot = new Telegraf(token);
bot.use(session());
bot.use(i18n.middleware())
const stage = new Scenes.Stage([selectValutesScenes])
bot.use(stage.middleware())
bot.hears("/start", ctx => ctx.scene.enter("selectValutes"));

//bot.use((new LocalSession({ database: 'session.json' })).middleware())

//bot.use(require('./composers/start.composers'))
//bot.context.status
let status;
//const crossRates = crossRatesList.result.filter((cr) => {
//  return cr.isDisabled === false;
//});
//const disabledCrossRates = crossRatesList.filter((cr) => {
//  return cr.isDisabled === true;
//});
//Объекты валют
let giveValute;
let getValute;
// для подсчитанные суммы валют
let getAmount;

//const directExchangeRate = (ctx) => {
//  if (!ctx.session.giveValute || !ctx.session.getValute) return null;
//  const crossRate = crossRates.find((cr) => {
//    return (
//      cr.from.bestchangeKey === ctx.session.giveValute.bestchangeKey &&
//      cr.to.bestchangeKey === ctx.session.getValute.bestchangeKey
//    );
//  });
//
//  if (crossRate) return 1 / crossRate.out;
//  return (
//    ctx.session.getValute &&
//    ctx.session.giveValute &&
//    (ctx.session.getValute.percentGet * ctx.session.getValute.course) /
//    (ctx.session.giveValute.percentGive * ctx.session.giveValute.course)
//  );
//};
//
//const getFixFactor = (valute) => {
//  return ["RUB", "USDT"].includes(valute?.key) ? 2 : 5;
//};
//
//
//const calculateGetAmount = (ctx) => {
//  return parseFloat(
//    (ctx.session.giveAmount / directExchangeRate(ctx)).toFixed(
//      getFixFactor(ctx.session.getValute)
//    )
//  );
//};
//
//
//function setGiveAmount(ctx, value) {
//  console.log(ctx)
//  const fixedValue = (+value).toFixed(getFixFactor(ctx.session.giveValute));
//  ctx.session.giveAmount = parseFloat(fixedValue);
//  ctx.session.getAmount = calculateGetAmount(ctx);
//}
//
//
//async function prepareToPay(ctx) {
//  console.log('start');
//  const prepareToPayList = Markup.inlineKeyboard(
//    [{ text: 'Да', callback_data: 'yes' }],
//    [{ text: 'Назад', callback_data: 'back' }]);
//  status = 'isPrepareToPay';
//  await ctx.reply('Подготовка к оплате', prepareToPayList);
//}
//// 1)При /start отдаем валюту

//
//async function selectGetValute(ctx) {
//  ctx.session.getValuteList = valutes.result.filter(valute => valute.isGet === true)
//    .map(valute => [{ text: valute.title, callback_data: valute.bestchangeKey }]);
//  const dropdownValuteList = Markup.inlineKeyboard(ctx.session.getValuteList);
//  await ctx.reply('Теперь напишите тикер валюты, которую хотите получить:', dropdownValuteList);
//}
//
//// Register callback query handler
//bot.action(/.*/, async (ctx) => {
//  const chosenValute = ctx.match[0];
//  if (status === 'isGive') {
//    ctx.session.giveValute = valutes.result.find(valute => valute.bestchangeKey === chosenValute);
//    await ctx.reply(`Вы выбрали вариант: ${ctx.session.giveValute.title}`);
//    await selectGetValute(ctx);
//    status = 'isGet';
//  }
//  else if (status === 'isGet') {
//    ctx.session.getValute = valutes.result.find(valute => valute.bestchangeKey === chosenValute);
//    await ctx.reply(`Вы выбрали направление: ${ctx.session.giveValute.title + ' -> ' + ctx.session.getValute.title}. Минимальная сумма к обмену ${ctx.session.giveValute.minGive + ' ' + ctx.session.giveValute.key} или ${ctx.session.getValute.minGive + ' ' + ctx.session.getValute.key}. Напишите сумму к обмену:`);
//  }
//  else if (status === 'isPrepareToPay' && ctx.match[0] === 'yes') {
//    ctx.reply(`Внесите адрес для получения средств. Проверьте корректность внесения, если адрес будет содержать ошибку, администрация обменного пункта не несет ответственности.`);
//  }
//});

// Start command handler

//bot.on('text', async (ctx) => {
//  if (status === 'isGet') {
//    const userAmount = parseFloat(ctx.message.text.replace(',', '.'));
//    if (giveValute?.minGive > userAmount) {
//      await ctx.reply('Введенное значение меньше допустимого');
//    } else {
//      setGiveAmount(ctx, userAmount);
//      await ctx.reply(`Ваш обмен: ${ctx.session.giveAmount} ${ctx.session.giveValute?.key} к отправке ${ctx.session.getAmount} ${ctx.session.getValute?.key} к получению. Текущий курс ${ctx.session.giveValute?.course}/${ctx.session.getValute?.course}. Курс сделки будет зафиксирован в момент подтверждения отправки средств. Если подтверждаете, ответьте - да`);
//      await prepareToPay(ctx);
//    }
//  }
//  else if (status === 'isPrepareToPay') {
//    const dataToSend = {
//      status: 0, // TODO: проверьте этот статус
//      referal: null, // этот параметр будет установлен, если есть значение referer в локальном хранилище позже
//      isCrypto: false, // TODO: это тоже
//      ip: "192.168.1.1", // этот параметр будет установлен в новом заказе позже
//      ua: null,
//      give: ctx.session.giveValute
//        ? {
//          valute_id: ctx.session.giveValute._id,
//          forms: {
//            count: ctx.session.giveAmount,
//            email: 'kuzen@rambler.ru',
//            nomer_koshelka: "anojfiwajfoijawo"
//          },
//        }
//        : null,
//      get: ctx.session.getValute
//        ? {
//          valute_id: ctx.session.getValute._id,
//          isCash: ctx.session.getValute.isCash,
//          forms: {
//            result: ctx.session.getAmount,
//            email: 'kuzen@rambler.ru',
//            nomer_koshelka_s_kotorogo_otpravlyaete: 'awfh63782bn9enejw9'
//          },
//        }
//        : null,
//    };
//    const response = await createTransaction(dataToSend);
//    console.log('response =', response);
//  }
//});
//

// 2)Получаем валюту



// Listen for any kind of message. There are different kinds of messages.
//bot.on('message', async (ctx) => {
//  const chatId = ctx.chat.id;
//  console.log('ctxchatid =',chatId)
//  if (ctx.message.text === '/start') {
//    try {
//      selectGiveValute(chatId, ctx)
//    } catch (error) {
//      console.error('Error:', error);
//    }
//  } 
//else if (status === 'isGet') {
//    const userAmount = parseFloat(ctx.message.text.replace(',', '.'))
//    console.log(userAmount)
//    if (giveValute?.minGive > userAmount) {
//      bot.telegram.sendMessage(chatId, 'Введенное значение меньше допустимого');
//    } else {
//      setGiveAmount(userAmount)
//      bot.telegram.sendMessage(chatId, `Ваш обмен: ${giveAmount} ${giveValute?.key} к отправке ${getAmount} ${getValute?.key} к получению. Текущий курс ${giveValute?.course}/${getValute?.course}. Курс сделки будет зафиксирован в момент подтверждения отправки средств. Если подтверждаете ответьте - да`)
//        .then(() => { prepareToPay(chatId) });
//
//    }
//  //} else if (status === 'isPrepareToPay') {
//   const dataToSend = {
//     status: 0, // TODO: проверьте этот статус
//     referal: null, // этот параметр будет установлен, если есть значение referer в локальном хранилище позже
//     isCrypto: false, // TODO: это тоже
//     ip: "192.168.1.1", // этот параметр будет установлен в новом заказе позже
//     ua: null,
//     give: giveValute
//       ? {
//         valute_id: giveValute._id,
//         forms: {
//           count: giveAmount,
//           email: 'kuzen@rambler.ru',
//           nomer_koshelka: "anojfiwajfoijawo"
//         },
//       }
//       : null,
//     get: getValute
//       ? {
//         valute_id: getValute._id,
//         isCash: getValute.isCash,
//         forms: {
//           result: getAmount,
//           email: 'kuzen@rambler.ru',
//           nomer_koshelka_s_kotorogo_otpravlyaete: 'awfh63782bn9enejw9'
//         },
//       }
//       : null,
//   };
//   const response = await createTransaction(dataToSend);
//   console.log('response =', response);
///  //}
///});
//
///bot.on('callback_query', (query) => {
///  const chatId = query.update.callback_query.from.id
///  let choosenValute = query.data;
//  if (status === 'isGive') {
//    giveValute = valutes.result.find(valute => valute.bestchangeKey === choosenValute)
//    console.log(giveValute)
//    bot.telegram.sendMessage(chatId, `Вы выбрали вариант: ${giveValute.title}`);
//    selectGetValute(chatId)
//    status = 'isGet'
//  }
//  else if (status === 'isGet') {
//    getValute = valutes.result.find(valute => valute.bestchangeKey === choosenValute)
//    bot.telegram.sendMessage(chatId, `Вы выбрали направление: ${giveValute.title + ' -> ' + getValute.title}. Минимальная сумма к обмену ${giveValute.minGive + ' ' + giveValute.key} или ${getValute.minGive + ' ' + getValute.key} напишите сумму к обмену`);
//  }
//  else if (status === 'isPrepareToPay' && query.data === 'yes') {
//    bot.telegram.sendMessage(chatId, `Внесите адрес для получения средств. Проверьте корректность внесения, если адрес будет содержать ошибку, администрация обменного пункта не несет ответственности.`);
//  }
//});

bot.launch()
