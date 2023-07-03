const { Markup, Scenes, Composer } = require('telegraf');
const { message } = require('telegraf/filters');
const { giveValutesKeyboard, getValutesKeyboard, selectedValutesKeyboard } = require('../utils/keyboard/valutes-keyboard')
const phoneKeyboard = require('../utils/keyboard/phone-keyboard')
const prepareToPayKeyboard = require('../utils/keyboard/preparetopay-keyboard')
const confirmOrderKeyboard = require('../utils/keyboard/confirmorder-keyboard')
const { valutes, createTransaction, updateOrder, getOrder } = require('../services/index');
const { setGiveAmount } = require('../helpers/setgiveamount');
const { setGetAmount } = require('../helpers/setgetamount');
const cron = require('node-cron');

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
const start = new Composer()
const selectGiveValute = new Composer()
const selectGetValute = new Composer()
const setValute = new Composer()
const setAddress = new Composer()
const setMemo = new Composer()
const setFullName = new Composer()
const setEmail = new Composer()
const createOrder = new Composer()
const checkOrder = new Composer()

start.start(async (ctx) => {
  try {
    const giveValutes = await giveValutesKeyboard()
    ctx.wizard.state.data = new WizardData();
    await ctx.reply(ctx.i18n.t('selectgivevalute'), giveValutes)
    return ctx.wizard.next();
  } catch (error) {
    console.log(error)
    await ctx.reply(ctx.i18n.t('error'))
    return ctx.scene.leave();
  }
});

// выбрал валюту для отправления и вывел список валют для получения
selectGiveValute.on("callback_query", async (ctx) => {
  try {
    const chosenValute = ctx.callbackQuery.data;
    ctx.wizard.state.data.giveValute = await findValute(ctx, chosenValute);
    const getValutes = await getValutesKeyboard()
    await ctx.editMessageReplyMarkup();
    await ctx.reply(ctx.i18n.t('selectgetvalute'), getValutes)
    await ctx.answerCbQuery();
    return ctx.wizard.next()
  } catch (error) {
    console.log(error)
    await ctx.reply(ctx.i18n.t('error'))
    return ctx.scene.leave();
  }
});

selectGiveValute.command('cancel', async (ctx) => {
  try {
    await ctx.reply(ctx.i18n.t('cancelbeforeoder'))
    return ctx.scene.leave();
  } catch (error) {
    console.log(error)
  }
});

selectGetValute.command('cancel', async (ctx) => {
  try {
    await ctx.reply(ctx.i18n.t('cancelbeforeoder'))
    return ctx.scene.leave();
  } catch (error) {
    console.log(error)
  }
});

// выбрал валюту для получения и вывел две валюты для выбора оплаты
selectGetValute.on("callback_query", async (ctx) => {
  try {
    const chosenValute = ctx.callbackQuery.data;
    ctx.wizard.state.data.getValute = await findValute(ctx, chosenValute);
    const selectValutes = selectedValutesKeyboard(ctx)
    await ctx.editMessageReplyMarkup();
    await ctx.reply(ctx.i18n.t('settingvalute', { ctx }), selectValutes);
    await ctx.answerCbQuery();
    return ctx.wizard.next();
  }
  catch (error) {
    console.log(error)
    await ctx.reply(ctx.i18n.t('error'))
    return ctx.scene.leave();
  }
});

///может быть эту часть кода можно сделать красивее lol
setValute.on('callback_query', async (ctx) => {
  try {
    await ctx.editMessageReplyMarkup();
    ///рудиментный функционал вовзрата замены валют в при выборе валюты для оплаты

    //if (ctx.callbackQuery.data === 'get') { 
    //ctx.wizard.state.data.choosenValute = ctx.wizard.state.data.getValute;
    //} else if (ctx.callbackQuery.data === 'give') {
    //  ctx.wizard.state.data.choosenValute = ctx.wizard.state.data.giveValute;
    //} else {
    //  await ctx.answerCbQuery();
    //  return ctx.wizard.steps[ctx.wizard.cursor = 1].handler(ctx);
    //}
    ctx.wizard.state.data.choosenValute = await findValute(ctx, ctx.callbackQuery.data)
    ctx.reply(ctx.i18n.t('inputsum', { ctx }))
    //ctx.reply(ctx.i18n.t('yourexchange'), { ctx });
  }
  catch (error) {
    console.log(error)
    await ctx.reply(ctx.i18n.t('error'))
    return ctx.scene.leave();
  }
});
///

setValute.command('cancel', async (ctx) => {
  try {
    await ctx.reply(ctx.i18n.t('cancelbeforeoder'))
    return ctx.scene.leave();
  } catch (error) {
    console.log(error)
  }
});

setValute.on("text", async (ctx) => {
  try {
    const regEx = /^[0-9]*[.,]?[0-9]+$/;
    const userAmount = parseFloat(ctx.message.text.replace(',', '.'))
    const choosenValute = ctx.wizard.state.data.choosenValute
    if (!choosenValute) {
      return
    }
    if (regEx.test(ctx.message.text)) {
      if (choosenValute.minGive > userAmount) {
        await ctx.reply('Введенное значение меньше допустимого');
      } else {
        try {
          console.log('choosenValute.bestchangeKey = ', choosenValute.bestchangeKey)
          console.log('ctx.wizard.state.data.giveValute.bestchangeKey = ', ctx.wizard.state.data.giveValute.bestchangeKey)
          const { giveAmount, getAmount } = choosenValute.bestchangeKey === ctx.wizard.state.data.giveValute.bestchangeKey ? await setGiveAmount(ctx, userAmount) : await setGetAmount(ctx, userAmount)
          ctx.wizard.state.data.giveAmount = giveAmount;
          ctx.wizard.state.data.getAmount = getAmount;
          await ctx.reply(ctx.i18n.t('preparetopay', { ctx }), prepareToPayKeyboard);
          return ctx.wizard.next();
        } catch (error) {
          console.error('Error setting amounts:', error);
        }
      }
    }
    else {
      await ctx.reply('Некорректное значение суммы пополнения');
    }
  }
  catch (error) {
    console.log(error)
    await ctx.reply(ctx.i18n.t('error'))
    return ctx.scene.leave();
  }
})

setAddress.on("callback_query", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup();
    if (ctx.callbackQuery.data === 'back') {
      await ctx.reply(ctx.i18n.t('cancelbeforeoder'))
      return ctx.scene.leave();
    }
    ctx.wizard.state.data.confirm = true;
    if (ctx.wizard.state.data.getValute.categories.includes('bank')) {
      await ctx.reply(ctx.i18n.t('ifbank'));
    }
    else {
      await ctx.reply(ctx.i18n.t('ifcrypto'));
    }
  }
  catch (error) {
    console.log(error)
    await ctx.reply(ctx.i18n.t('error'))
    return ctx.scene.leave();
  }
})

setAddress.command('cancel', async (ctx) => {
  try {
    await ctx.reply(ctx.i18n.t('cancelbeforeoder'))
    return ctx.scene.leave();
  } catch (error) {
    console.log(error)
  }
});

setAddress.on("text", async (ctx) => {
  try {
    if (ctx.wizard.state.data.confirm) {
      ctx.wizard.state.data.address = ctx.message.text;
      if (ctx.wizard.state.data.getValute.bestchangeKey === 'XRP') {
        await ctx.reply('Пожалуйста, введите memo');
        return ctx.wizard.next()
      }
      else if (ctx.wizard.state.data.getValute.bestchangeKey === 'UPCNY' || ctx.wizard.state.data.getValute.bestchangeKey === 'CARDCNY') {
        await ctx.reply('Введите ваше полное имя в формате (имя и фамилия)');
        console.log(ctx.wizard.cursor)
        return ctx.wizard.selectStep(6)
      }
      else {
        await ctx.reply('Пожалуйста, введите email');
        console.log(ctx.wizard.cursor)
        return ctx.wizard.selectStep(7)
      }
    }
    else {
      return
    }
  } catch (error) {
    console.log(error)
    await ctx.reply(ctx.i18n.t('error'))
    return ctx.scene.leave();
  }
})

setMemo.on('text', async (ctx) => {
  try {
    ctx.wizard.state.data.memo = ctx.message.text;
    console.log('memo = ', ctx.wizard.state.data.memo)
    await ctx.reply('Пожалуйста, введите email');
    return ctx.wizard.next()
  } catch (error) {
    console.log(error)
    await ctx.reply(ctx.i18n.t('error'))
    return ctx.scene.leave();
  }
})

setFullName.on("text", async (ctx) => {
  const fullName = ctx.message.text;
  const namePattern = /^[a-zA-Zа-яА-Я]+ [a-zA-Zа-яА-Я]+$/; // This pattern matches a string containing exactly two words
  if (!namePattern.test(fullName)) {
    // If the name doesn't match the pattern, inform the user and return without proceeding
    return ctx.reply('Пожалуйста, введите ваше полное имя в формате (имя и фамилия).');
  }
  else {
    ctx.wizard.state.data.fullName = fullName;
    await ctx.reply('Пожалуйста, введите email');
    return ctx.wizard.next()
  }
  // If the name does match the pattern, proceed as normal...
});

setEmail.email((/.*@.*\..*/, async (ctx) => {
  try {
    ctx.wizard.state.data.email = ctx.message.text;
    await ctx.reply(ctx.i18n.t('addphonenumber'), phoneKeyboard);
    return ctx.wizard.next()
  }
  catch (error) {
    console.log(error)
    await ctx.reply(ctx.i18n.t('error'))
    return ctx.scene.leave();
  }
}));

setEmail.on('text', async (ctx) => {
  await ctx.reply("Некорректный email")
})


///если пользователь отправил свой номер qiwi контактом
createOrder.on('contact', async (ctx) => {
  try {
    ctx.wizard.state.data.phone = ctx.message.contact.phone_number;
    const giveKey = ctx.wizard.state.data.giveValute.forms[0]["key"];
    const getKey = ctx.wizard.state.data.getValute.forms[0]["key"];

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
            [giveKey]: ctx.wizard.state.data.phone || ''
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
            [getKey]: ctx.wizard.state.data.address || '',
            ...(ctx.wizard.state.data.memo ? { 'memo,_tag': ctx.wizard.state.data.memo } : {}),
            ...(ctx.wizard.state.data.fullName ? { 'imya,_familiya_poluchatelya': ctx.wizard.state.data.fullName } : {})

          },

        }
        : null,
    };

    const response = await createTransaction(dataToSend);
    ctx.wizard.state.data.orderStatus = response.status;
    const giveAddress = response.giveValute.wallet.forms[0].description;
    const getAddress = response.getValute.wallet.forms[0]?.description || '';
    ctx.wizard.state.data.giveAddress = giveAddress;
    ctx.wizard.state.data.getAddress = getAddress;
    ctx.wizard.state.data.id = response._id
    await ctx.reply(ctx.i18n.t('yourexchange', { ctx }), confirmOrderKeyboard);
    return ctx.wizard.next()
  } catch (error) {
    await ctx.reply(ctx.i18n.t('error'))
    return ctx.scene.leave();
  }
})

///если пользователь отправил свой номер qiwi текстом
createOrder.on('text', async (ctx) => {
  try {
    ctx.wizard.state.data.phone = ctx.message.text;
    const giveKey = ctx.wizard.state.data.giveValute.forms[0]["key"];
    const getKey = ctx.wizard.state.data.getValute.forms[0]["key"];
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
            [giveKey]: ctx.wizard.state.data.phone || ''
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
            [getKey]: ctx.wizard.state.data.address || '',
            ...(ctx.wizard.state.data.memo ? { 'memo,_tag': ctx.wizard.state.data.memo } : {}),
            ...(ctx.wizard.state.data.fullName ? { 'imya,_familiya_poluchatelya': ctx.wizard.state.data.fullName } : {})
          },
        }
        : null,
    };
    console.log('getKey', getKey)
    console.log('dataToSendforms = ', dataToSend)
    const response = await createTransaction(dataToSend);
    ctx.wizard.state.data.orderStatus = response.status;
    ctx.wizard.state.data.giveAddress = response.giveValute.wallet.forms[0].description;
    ctx.wizard.state.data.getAddress = response.getValute.wallet.forms[0]?.description || '';
    ctx.wizard.state.data.id = response._id
    ctx.wizard.state.data.url = response.url
    console.log('find url = ',response)
    await ctx.reply(ctx.i18n.t('yourexchange', { ctx }), confirmOrderKeyboard);
    return ctx.wizard.next()
  } catch (error) {
    console.log(error)
    await ctx.reply(ctx.i18n.t('error'))
    return ctx.scene.leave();
  }
})

checkOrder.on('callback_query', async (ctx) => {
  try {
    await ctx.editMessageReplyMarkup();
    let response;
    const data = { id: ctx.wizard.state.data.id }
    switch (ctx.callbackQuery.data) {
      case 'confirm':
        ctx.wizard.state.data.orderStatus = 1;
        data.status = ctx.wizard.state.data.orderStatus;
        response = await updateOrder(data).then(() => {
          ctx.reply(ctx.i18n.t('ordercreated'));
        })
        const task = cron.schedule('*/1 * * * *', async () => {
          response = await getOrder(data.id);
          console.log('cron start = ', response)
          if (response.status === 2) {
            console.log('confirm!!')
            if (response.resultMessage != '') {
              ctx.reply(`Сообщение от оператора: ${response.resultMessage}`)
            }
            ctx.replyWithHTML(ctx.i18n.t('operatorconfirmorder', { ctx }));
            task.stop();
            return ctx.scene.leave();
          }
          if (response.status === 3) {
            console.log('cancel!!')
            if (response.resultMessage != '') {
              ctx.reply(`Сообщение от оператора: ${response.resultMessage}`)
            }
            ctx.replyWithHTML(ctx.i18n.t('cancelorder'));
            task.stop();
            return ctx.scene.leave();
          }
        });
        break;
      case 'cancel':
        ctx.wizard.state.data.orderStatus = 4;
        data.status = ctx.wizard.state.data.orderStatus
        response = await updateOrder(data)
        await ctx.replyWithHTML(ctx.i18n.t('clientcancelorder'))
        return ctx.scene.leave();
      default:
        break;
    }
  } catch (error) {
    console.log(error);
    await ctx.reply(ctx.i18n.t('error'))
    return ctx.scene.leave();
  }
})


const exchange = new Scenes.WizardScene(
  "exchange", start, selectGiveValute, selectGetValute, setValute, setAddress, setMemo, setFullName, setEmail, createOrder, checkOrder  // Our wizard scene id, which we will use to enter the scene
);

module.exports = exchange;
