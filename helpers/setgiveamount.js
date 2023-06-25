const { crossRatesList } = require('../services/index');

async function getCrossRates() {
    const response = await crossRatesList();
    return response.filter((cr) => cr.isDisabled === false);
}

const directExchangeRate = async (ctx) => {
    const crossRates = await getCrossRates();
    if (!ctx.wizard.state.data.giveValute || !ctx.wizard.state.data.getValute) return null;
    const crossRate = crossRates.find((cr) => {
        return (
            cr.from.bestchangeKey === ctx.wizard.state.data.giveValute.bestchangeKey &&
            cr.to.bestchangeKey === ctx.wizard.state.data.getValute.bestchangeKey
        );
    });

    if (crossRate) return 1 / crossRate.out;
    return (
        ctx.wizard.state.data.getValute &&
        ctx.wizard.state.data.giveValute &&
        (ctx.wizard.state.data.getValute.percentGet * ctx.wizard.state.data.getValute.course) /
        (ctx.wizard.state.data.giveValute.percentGive * ctx.wizard.state.data.giveValute.course)
    );
};

const getFixFactor = (valute) => {
    return ["RUB", "USDT"].includes(valute?.key) ? 2 : 5;
};

const calculateGetAmount = async (ctx, giveAmount) => {
    return parseFloat(
        (giveAmount / await directExchangeRate(ctx)).toFixed(
            getFixFactor(ctx.wizard.state.data.getValute)
        )
    );
};

async function setGiveAmount(ctx, value) {
    const fixedValue = (+value).toFixed(getFixFactor(ctx.wizard.state.data.giveValute));
    const giveAmount = parseFloat(fixedValue);
    const getAmount = await calculateGetAmount(ctx, giveAmount);
    return { giveAmount, getAmount }
}

module.exports = { setGiveAmount };
