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
const setEmail = new Composer()
const createOrder = new Composer()
const checkOrder = new Composer()

start.use(async (ctx) => {
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
          const { giveAmount, getAmount } = choosenValute.bestchangeKey === ctx.wizard.state.data.giveValute.bestchangeKey ? await setGiveAmount(ctx, userAmount) : await setGetAmount(ctx, userAmount)
          ctx.wizard.state.data.giveAmount = giveAmount;
          ctx.wizard.state.data.getAmount = getAmount;
        } catch (error) {
          console.error('Error setting amounts:', error);
        }
        await ctx.reply(ctx.i18n.t('preparetopay', { ctx }), prepareToPayKeyboard);
        return ctx.wizard.next();
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
      return ctx.scene.reenter();
    }
    else if (ctx.wizard.state.data.getValute.categories.includes('bank')) {
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

setAddress.on("text", async (ctx) => {
  try {
    ctx.wizard.state.data.address = ctx.message.text;
    await ctx.reply('Пожалуйста, введите email');
    return ctx.wizard.next()
  } catch (error) {
    console.log(error)
    await ctx.reply(ctx.i18n.t('error'))
    return ctx.scene.leave();
  }

})


setEmail.email((/.*@.*\..*/, async (ctx) => {
  try {
    ctx.wizard.state.data.email = ctx.message.text;
    await ctx.reply("Пожалуйста, предоставьте свой номер телефона, нажав кнопку ниже или введите его вручную.", phoneKeyboard);
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
            [getKey]: ctx.wizard.state.data.address || ''
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
    ctx.reply(ctx.i18n.t('confirmorder'), confirmOrderKeyboard);
    return ctx.wizard.next()
  } catch (error) {
    console.log(error)
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
            [getKey]: ctx.wizard.state.data.address || ''
          },
        }
        : null,
    };

    const response = await createTransaction(dataToSend);
    ctx.wizard.state.data.orderStatus = response.status;
    ctx.wizard.state.data.giveAddress = response.giveValute.wallet.forms[0].description;
    ctx.wizard.state.data.getAddress = response.getValute.wallet.forms[0]?.description || '';
    ctx.wizard.state.data.id = response._id
    await ctx.reply(ctx.i18n.t('yourexchange'), { ctx }, confirmOrderKeyboard);
    return ctx.wizard.next()
  } catch (error) {
    console.log(error)
    await ctx.reply(ctx.i18n.t('error'))
    return ctx.scene.leave();
  }
})

checkOrder.on('callback_query', async (ctx) => {
  try {
    let response;
    const data = { id: ctx.wizard.state.data.id }
    switch (ctx.callbackQuery.data) {
      case 'confirm':
        ctx.wizard.state.data.orderStatus = 1;
        data.status = ctx.wizard.state.data.orderStatus;
        response = await updateOrder(data).then(() => {
          ctx.reply('Заявка успешно создана! Наш менеджер проверяет заявку. Это может занять некоторое время. Страница обновится автоматически, когда заявка будет принята')
        })
        const task = cron.schedule('* * * * * *', async () => {
          response = await getOrder(data.id);
          if (response.status === 2) {
            ctx.reply(`${ctx.wizard.state.data.getAmount} ${ctx.wizard.state.data.getValute.title} отправлены на  ${ctx.wizard.state.data.getAddress}. Спасибо за обмен не забудьтее оставить отзыв на https://www.bestchange.ru/catbit-exchanger.html`);
            task.stop();
            return ctx.scene.leave(); // Выйти из сцены после выполнения задачи
          }
          if (response.status === 3) {
            ctx.replyWithHTML('Время инвойса закончилось для новой операции нажмите /start');
            task.stop();
            return ctx.scene.leave(); // Выйти из сцены после выполнения задачи
          }
        });
        break;
      case 'cancel':
        ctx.wizard.state.data.orderStatus = 4;
        data.status = ctx.wizard.state.data.orderStatus
        response = await updateOrder(data)
        await ctx.replyWithHTML('Вы отменили заявку, напишите /start для возобновления')
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
  "exchange", start, selectGiveValute, selectGetValute, setValute, setAddress, setEmail, createOrder, checkOrder  // Our wizard scene id, which we will use to enter the scene
);

module.exports = exchange;
