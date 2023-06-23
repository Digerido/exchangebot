const { Markup, Scenes, Composer } = require('telegraf');
const { giveValutesKeyboard, getValutesKeyboard } = require('../utils/keyboard/valutes-keyboard')
const { valutes, createTransaction } = require('../services/index');
const { setGiveAmount } = require('../helpers/index');

let giveValute;
let getValute;
let giveAmount;
let getAmount;

const selectGiveValute = new Composer()

selectGiveValute.command('start', async (ctx) => {
  try {
    const giveValutes = await giveValutesKeyboard()
    ctx.wizard.state.data = {};
    await ctx.reply(ctx.i18n.t('selectgivevalute'), giveValutes)
  } catch (error) {
    console.error('Error:', error);
  }
});


selectGiveValute.on("callback_query", async (ctx) => {
  const chosenValute = ctx.callbackQuery.data;
  const valutesList = await valutes();
  ctx.wizard.state.data.giveValute = valutesList.find(valute => valute.bestchangeKey === chosenValute);
  giveValute = ctx.scene.state.data.giveValute;
  await ctx.reply(`Вы выбрали вариант: ${giveValute.title}`);
  const getValutes = await getValutesKeyboard()
  await ctx.reply(ctx.i18n.t('selectgetvalute'), getValutes)
  return ctx.wizard.next()
});


const selectGetValute = new Composer()

selectGetValute.on("callback_query", async (ctx) => {
  const chosenValute = ctx.callbackQuery.data;
  const valutesList = await valutes();
  ctx.wizard.state.data.getValute = valutesList.find(valute => valute.bestchangeKey === chosenValute);
  getValute = ctx.wizard.state.data.getValute;
  await ctx.reply(`Вы выбрали направление: ${giveValute.title + ' -> ' + getValute.title}. Минимальная сумма к обмену ${giveValute.minGive + ' ' + giveValute.key} или ${getValute.minGive + ' ' + getValute.key}. Напишите сумму к обмену:`);
  return ctx.wizard.next()
});

const userSendAmount = new Composer()

userSendAmount.on("text", async (ctx) => {
  const userAmount = parseFloat(ctx.message.text.replace(',', '.'))
  if (giveValute?.minGive > userAmount) {
    await ctx.reply('Введенное значение меньше допустимого');
  } else {
    const calc = await setGiveAmount(ctx, userAmount)
    giveAmount = calc.giveAmount
    getAmount = calc.getAmount
    await ctx.reply(`Ваш обмен: ${calc.giveAmount} ${giveValute?.key} к отправке ${calc.getAmount} ${getValute?.key} к получению. Текущий курс ${giveValute?.course}/${getValute?.course}. Курс сделки будет зафиксирован в момент подтверждения отправки средств. Если подтверждаете ответьте - да`)
    const prepareToPayList = Markup.inlineKeyboard(
      [[{ text: 'Да', callback_data: 'yes' }],
      [{ text: 'Назад', callback_data: 'back' }]]);
    await ctx.reply('Подготовка к оплате', prepareToPayList);
  }

})

userSendAmount.on("callback_query", async (ctx) => {
  ctx.reply(`Внесите адрес для получения средств. Проверьте корректность внесения, если адрес будет содержать ошибку, администрация обменного пункта не несет ответственности.`);
  return ctx.wizard.next()
})

const userCreateTransaction = new Composer()

userCreateTransaction.on("text", async (ctx) => {
console.log()
  const dataToSend = {
    status: 0, // TODO: проверьте этот статус
    referal: null, // этот параметр будет установлен, если есть значение referer в локальном хранилище позже
    isCrypto: false, // TODO: это тоже
    ip: "192.168.1.1", // этот параметр будет установлен в новом заказе позже
    ua: null,
    give: giveValute
      ? {
        valute_id: giveValute._id,
        forms: {
          count: giveAmount,
          nomer_koshelka_s_kotorogo_otpravlyaete: 'sadsadasdawvndjio'
        },
      }
      : null,
    get: getValute
      ? {
        valute_id: getValute._id,
        isCash: false,
        forms: {
          result: getAmount,
          email: 'kuzenez@rambler.ru',
          nomer_koshelka: 'awfh63782bn9enejw9'
        },
      }
      : null,
  };
  try {
    const response = await createTransaction(dataToSend);
    console.log('transaction succesfully = ', response)
  } catch (error) {
    console.log(error)
  }
})



const selectValutesScenes = new Scenes.WizardScene(
  "selectValutes", selectGiveValute, selectGetValute, userSendAmount, userCreateTransaction  // Our wizard scene id, which we will use to enter the scene
);

module.exports = selectValutesScenes;
