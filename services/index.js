const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

const createTransaction = async (dataToSend) => {
    await axios.post(`${getBaseUrl}/api/public/n`, dataToSend, {
        headers: { 'Content-Type': 'application/json' }
    }).then(res => res.data);
};

const valutes = async () => {
    await axios.get(`${getBaseUrl}/api/public/valutes`).then(response => {
        return response.data.result
    });
};

const crossRatesList = async () => {
    return await axios.get(`${getBaseUrl}/api/public/cross-rates`).then(response => {
        return response.data.result
    });
};


module.exports = createTransaction, valutes, crossRatesList;
