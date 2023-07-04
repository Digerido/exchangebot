const { createTransaction, getOrder } = require('../services/index');
const confirmOrderKeyboard = require('../utils/keyboard/confirmorder-keyboard')
const cron = require('node-cron');
///Пока что так, два дубликата для ввода номера
///если пользователь отправил свой номер qiwi контактом
async function sendData(ctx) {
    try {
      ctx.wizard.state.data.phone = ctx.message.text;
      const giveKey = ctx.wizard.state.data.giveValute.forms[0]["key"];
      const getKey = ctx.wizard.state.data.getValute.forms[0]["key"];
      const dataToSend = {
        status: 0,
        referal: null,
        isCrypto: false,
        source: 'telegram',
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
      let response = await createTransaction(dataToSend);
      ctx.wizard.state.data.orderStatus = response.status;
      ctx.wizard.state.data.giveAddress = response.giveValute.wallet.forms[0].description;
      ctx.wizard.state.data.getAddress = response.getValute.wallet.forms[0]?.description || '';
      ctx.wizard.state.data.id = response._id
      ctx.wizard.state.data.url = response.url
      await ctx.reply(ctx.i18n.t('yourexchange', { ctx }), confirmOrderKeyboard);
      const checkPayment = cron.schedule('* * * * *', async () => {
        console.log('check')
        response = await getOrder(ctx.wizard.state.data.id);
        console.log('stattus = ', response.status)
        switch (response.status) {
          case 1:
            ctx.reply(ctx.i18n.t('ordercreated', { ctx }));
            checkPayment.stop();
            break;
          case 3:
            console.log('cancel!!');
            ctx.replyWithHTML(ctx.i18n.t('timecancelorder', { ctx }));
            checkPayment.stop();
            ctx.scene.leave();
            break;
        }
      });
  
      const resultPayment = cron.schedule('* * * * *', async () => {
        response = await getOrder(ctx.wizard.state.data.id);
        switch (response.status) {
          case 2:
            console.log('confirm!!')
            if (response.resultMessage != '') {
              ctx.reply(`Сообщение от оператора: ${response.resultMessage}`)
            }
            ctx.replyWithHTML(ctx.i18n.t('operatorconfirmorder', { ctx }));
            resultPayment.stop();
            return ctx.scene.leave();
          case 3:
            console.log('cancel!!')
            if (response.resultMessage != '') {
              ctx.reply(`Сообщение от оператора: ${response.resultMessage}`)
            }
            ctx.replyWithHTML(ctx.i18n.t('cancelorder', { ctx }));
            resultPayment.stop();
            return ctx.scene.leave();
        }
      });
  
      ctx.wizard.state.data.checkPayment = checkPayment;
      ctx.wizard.state.data.resultPayment = resultPayment;
      return ctx.wizard.next()
    } catch (error) {
      console.log(error)
      await ctx.reply(ctx.i18n.t('error'))
      return ctx.scene.leave();
    }
  }


module.exports = { sendData };