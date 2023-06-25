const { crossRatesList } = require('../services/index');

async function getCrossRates() {
    const response = await crossRatesList();
    return response.filter((cr) => cr.isDisabled === false);
}
const getFixFactor = (valute) => {
    return ["RUB", "USDT"].includes(valute?.key) ? 2 : 5;
};

async function setGetAmount(ctx, value) {
    const fixedValue = (+value).toFixed(getFixFactor(ctx.wizard.state.data.getValute));
    const getAmount = parseFloat(fixedValue);
    console.log('getAmount',getAmount)
    const giveAmount = await calculateGiveAmount(ctx, getAmount);
    return { giveAmount, getAmount }
}


const reverseExchangeRate = async (ctx) => {
    const giveValute = ctx.wizard.state.data.giveValute
    const getValute = ctx.wizard.state.data.getValute
    const crossRates = await getCrossRates()
    if (!giveValute || !getValute) return null;
    const crossRate = crossRates.find((cr) => {
        return (
            cr.from.bestchangeKey === giveValute.bestchangeKey &&
            cr.to.bestchangeKey === getValute.bestchangeKey
        );
    });
    if (crossRate) return crossRate.out;
    return (
        getValute &&
        giveValute &&
        (giveValute.percentGive * giveValute.course) /
        (getValute.percentGet * getValute.course)
    );
};

const calculateGiveAmount = async (ctx, getAmount) => {
    return parseFloat(
        (getAmount / await reverseExchangeRate(ctx)).toFixed(
            getFixFactor(ctx.wizard.state.data.giveValute)
        )
    );
}


module.exports = { setGetAmount };
