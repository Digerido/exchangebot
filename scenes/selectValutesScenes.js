const { Markup, Scenes, Composer } = require('telegraf');
const { giveValutesKeyboard, getValutesKeyboard } = require('../utils/keyboard/valutes-keyboard')
const phoneKeyboard = require('../utils/keyboard/phone-keyboard')

const { valutes, createTransaction, getOrder } = require('../services/index');
const { setGiveAmount } = require('../helpers/index');
class WizardData {
  constructor() {
    this.giveValute = null;
    this.getValute = null;
    this.giveAmount = null;
    this.getAmount = null;
  }
}

async function findValute(ctx, valuteKey) {
  const valutesList = await valutes();
  return valutesList.find(valute => valute.bestchangeKey === valuteKey);
}
const selectGiveValute = new Composer()

selectGiveValute.command('start', async (ctx) => {
  try {
    const giveValutes = await giveValutesKeyboard()
    ctx.wizard.state.data = new WizardData();
    await ctx.reply(ctx.i18n.t('selectgivevalute'), giveValutes)
  } catch (error) {
    console.error('Error:', error);
  }
});


selectGiveValute.on("callback_query", async (ctx) => {
  if (ctx.callbackQuery.data === 'back') {
    return ctx.wizard.back();
  }
  const chosenValute = ctx.callbackQuery.data;
  ctx.wizard.state.data.giveValute = await findValute(ctx, chosenValute);
  await ctx.reply(`Вы выбрали вариант: ${ctx.wizard.state.data.giveValute.title}`);
  const getValutes = await getValutesKeyboard()
  await ctx.reply(ctx.i18n.t('selectgetvalute'), getValutes)
  return ctx.wizard.next()
});


const selectGetValute = new Composer()

selectGetValute.on("callback_query", async (ctx) => {
  if (ctx.callbackQuery.data === 'back') {
    return ctx.wizard.back();
  }
  const chosenValute = ctx.callbackQuery.data;
  ctx.wizard.state.data.getValute = await findValute(ctx, chosenValute);
  await ctx.reply(`Вы выбрали направление: ${ctx.wizard.state.data.giveValute.title + ' -> ' + ctx.wizard.state.data.getValute.title}. Минимальная сумма к обмену ${ctx.wizard.state.data.giveValute.minGive + ' ' + ctx.wizard.state.data.giveValute.key} или ${ctx.wizard.state.data.getValute.minGive + ' ' + ctx.wizard.state.data.getValute.key}. Напишите сумму к обмену:`);
  return ctx.wizard.next()
});

const userSendAmount = new Composer()

userSendAmount.on("text", async (ctx) => {
  const userAmount = parseFloat(ctx.message.text.replace(',', '.'))
  if (ctx.wizard.state.data.giveValute?.minGive > userAmount) {
    await ctx.reply('Введенное значение меньше допустимого');
  } else {
    try {
      const { giveAmount, getAmount } = await setGiveAmount(ctx, userAmount);
      ctx.wizard.state.data.giveAmount = giveAmount;
      ctx.wizard.state.data.getAmount = getAmount;
    } catch (error) {
      console.error('Error setting amounts:', error);
    }
    await ctx.reply(`Ваш обмен: ${ctx.wizard.state.data.giveAmount} ${ctx.wizard.state.data.giveValute?.key} к отправке ${ctx.wizard.state.data.getAmount} ${ctx.wizard.state.data.getValute?.key} к получению. Текущий курс ${ctx.wizard.state.data.giveValute?.course}/${ctx.wizard.state.data.getValute?.course}. Курс сделки будет зафиксирован в момент подтверждения отправки средств. Если подтверждаете ответьте - да`)
    const prepareToPayList = Markup.inlineKeyboard(
      [[{ text: 'Да', callback_data: 'yes' }],
      [{ text: 'Назад', callback_data: 'back' }]]);
    await ctx.reply('Подготовка к оплате', prepareToPayList);
    return ctx.wizard.next();
  }
})

const userSendAddress = new Composer()

userSendAddress.on("callback_query", async (ctx) => {
  if (ctx.callbackQuery.data === 'back') {
    return ctx.wizard.back();
  }
  ctx.reply(`Внесите адрес для получения средств. Проверьте корректность внесения, если адрес будет содержать ошибку, администрация обменного пункта не несет ответственности.`);
})

userSendAddress.on("text", async (ctx) => {
  if (ctx.message.data === 'back') {
    return ctx.wizard.back();
  }
  else{
    ctx.wizard.state.data.address = ctx.message.text;
    await ctx.reply('Пожалуйста, введите email');
    return ctx.wizard.next()
  }
})

const userSendEmail = new Composer()
userSendEmail.email((/.*@.*\..*/, async (ctx) => {
    ctx.wizard.state.data.email = ctx.message.text;
    ctx.reply("Пожалуйста, предоставьте свой номер телефона, нажав кнопку ниже.", Markup.keyboard([
      [{ text: 'Отправить номер телефона', request_contact: true }]
    ]).resize().oneTime());  
    return ctx.wizard.next()
}));


const userSendPhone = new Composer()

userSendPhone.on('contact', async (ctx) => {
  try {
    ctx.wizard.state.data.phone = ctx.message.contact.phone_number;
    console.log(ctx.wizard.state.data.phone)
    return ctx.wizard.next()
  } catch (error) {
    console.log(error)
  }
});


const userCreateTransaction = new Composer()

userSendPhone.on('text',async (ctx) => {
  console.log('create trans')
  const dataToSend = {
    status: 0,
    referal: null,
    isCrypto: false,
    ip: "192.168.1.1",
    ua: null,
    give: ctx.wizard.state.data.giveValute
      ? {
        valute_id: ctx.wizard.state.data.giveValute._id,
        forms: {
          count: ctx.wizard.state.data.giveAmount,
          nomer_koshelka_s_kotorogo_otpravlyaete: ctx.wizard.state.data.address
        },
      }
      : null,
    get: ctx.wizard.state.data.getValute
      ? {
        valute_id: ctx.wizard.state.data.getValute._id,
        isCash: false,
        forms: {
          result: ctx.wizard.state.data.getAmount,
          email: ctx.wizard.state.data.email,
          nomer_koshelka: ctx.wizard.state.data.phone
        },
      }
      : null,
  };  
  try {
    const response = await createTransaction(dataToSend);
    ctx.wizard.state.data.status = response.status;
    const giveAddress = response.giveValute.wallet.forms[0].description;
    const getAddress = response.getValute.wallet.forms[0].description;
    const confirmOrder = Markup.inlineKeyboard(
      ctx.wizard.state.data.id = response._id
      [[{ text: 'Я оплатил', callback_data: 'confirm' }],
      [{ text: 'Отменить', callback_data: 'cancel' }]]);
    ctx.reply(`Ваш обмен ${ctx.wizard.state.data.giveAmount} ${ctx.wizard.state.data.giveValute.title} к отправке ${giveAddress} ${ctx.wizard.state.data.getAmount} ${ctx.wizard.state.data.getValute.title}, к получению ${getAddress} Текущий курс ${ctx.wizard.state.data.giveValute.course}/${ctx.wizard.state.data.getValute.course}. Курс сделки буде зафиксирован в момент подтверждения отправки средств. После получения средств мы оповестим об автоматической отправке по указанным вами реквизитам`, confirmOrder);
  } catch (error) {
    console.log(error)
  }
})

const checkOrder = new Composer()

checkOrder.on('callback_query', async (ctx) => {

  switch (ctx.callbackQuery.data) {
    case 'confirm':
      ctx.wizard.state.data.status = 1;
      break;
    case 'cancel':
      ctx.wizard.state.data.status = 2;
      ctx.reply('Наш менеджер проверяет заявку. Это может занять некоторое время. Страница обновится автоматически, когда заявка будет принята')
      break;
    default:
      break;

  }
  try {
    await ctx.editMessageReplyMarkup();
    ctx.reply('Наш менеджер проверяет заявку. Это может занять некоторое время. Страница обновится автоматически, когда заявка будет принята')
    const id = ctx.wizard.state.data.id;
    const response = await getOrder(id);
    console.log('check order = ', response)
  } catch (error) {
    console.error('Error while editing message reply markup:', error);
  }
})





const selectValutesScenes = new Scenes.WizardScene(
  "selectValutes", selectGiveValute, selectGetValute, userSendAmount, userSendAddress, userSendEmail, userSendPhone, userCreateTransaction, checkOrder  // Our wizard scene id, which we will use to enter the scene
);

module.exports = selectValutesScenes;
