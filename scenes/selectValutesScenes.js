const { Markup, Scenes } = require('telegraf');
const { valutes } = require('./api/index.js');

async function selectGiveValute(ctx) {
    ctx.session.giveValuteList = valutes.result.filter(valute => valute.isGive === true)
        .map(valute => [{ text: valute.title, callback_data: valute.bestchangeKey }]);
    status = 'isGive';
    const dropdownValuteList = Markup.inlineKeyboard(ctx.session.giveValuteList, { columns: 2 });
    await ctx.reply(ctx.i18n.t('welcome'), dropdownValuteList);
}

const start = new Scenes.WizardScene(
    "start", // Our wizard scene id, which we will use to enter the scene
    async (ctx) => {
        try {
            await selectGiveValute(ctx)
        } catch (error) {
            console.error('Error:', error);
        }
    },
    //async (ctx) => {
    //    const { mainKeyboard } = getMainKeyboard(ctx);
    //    await ctx.reply(ctx.i18n.t("shared.what_next"), mainKeyboard);
    //    return ctx.scene.leave();
    //}
);

module.exports = start;
