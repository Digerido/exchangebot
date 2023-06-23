const { crossRatesList } = require('../services/index');
let giveAmount;
let getAmount;
let crossRates;
async function getCrossRates() {
    const response = await crossRatesList();
    const crs = response.filter((cr) => {
        return cr.isDisabled === false;
    });
    return crs
}

const directExchangeRate = (ctx) => {
    if (!ctx.wizard.state.data.giveValute || !ctx.wizard.state.data.getValute) return null;
    const crossRate = crossRates.find((cr) => {
        return (
            cr.from.bestchangeKey === ctx.wizard.state.data.giveValute.bestchangeKey &&
            cr.to.bestchangeKey === ctx.wizard.state.data.getValute.bestchangeKey
        );
    });

    if (crossRate) return 1 / crossRate.out;
    console.log('crossRates', crossRate)
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

const calculateGetAmount = (ctx) => {
    console.log()
    return parseFloat(
        (giveAmount / directExchangeRate(ctx)).toFixed(
            getFixFactor(ctx.wizard.state.data.getValute)
        )
    );
};

async function setGiveAmount(ctx, value) {
    crossRates = await getCrossRates(ctx)
    const fixedValue = (+value).toFixed(getFixFactor(ctx.wizard.state.data.giveValute));
    giveAmount = parseFloat(fixedValue);
    getAmount = calculateGetAmount(ctx);
    console.log(giveAmount)
    return { giveAmount: giveAmount, getAmount: getAmount }
}

module.exports = { setGiveAmount };
