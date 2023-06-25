const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();
const getBaseUrl = process.env.GETBASEURL; // Replace with your base URL
const createTransaction = async (dataToSend) => {
    return axios.post(`${getBaseUrl}/api/public/transactions/create-transaction`, dataToSend)
    .then(response => { return response.data.result });
};

const valutes = async () => {
    return axios.get(`${getBaseUrl}/api/public/valutes`)
    .then(response => {
        return response.data.result;
    });
};

const crossRatesList = async () => {
    return axios.get(`${getBaseUrl}/api/public/cross-rates`)
    .then(response => {
        return response.data.result
    });
};

async function getOrder(id) {
    try {
      if (!id) throw new Error("Не задан ID заявки");
      isBusy.value = true;
      const { status: reqStatus, result } = await axios.get(
        `/api/public/transactions/get-transaction/${id}`
      );
      date = result.date;
      get= result.get;
      give = result.give;
      resultMessage = result.resultMessage;
      status = result.status;
      id = result._id;
      url = result.url || null;
      paymentId = result.paymentId || null;
      vanilaDepositStatus = result.vanilaDepositStatus || null;
      wbWithdrawStatus = result.wbWithdrawStatus || null;
      return result;
    } catch (error) {
      console.log(error.response);
      throw new Error(error);
    } finally {
      isBusy = false;
    }
  }


module.exports = { createTransaction, valutes, crossRatesList, getOrder };
