const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();
const getBaseUrl = process.env.GETBASEURL; // Replace with your base URL

const makeRequest = async (method, url, data = null) => {
    const config = {
        method,
        url: `${getBaseUrl}${url}`,
        ...(data && { data }),
    };
    try {
        const response = await axios(config);
        if (response.data.status) {
            return response.data.result;
        }
        else {
            throw new Error("Response status was not successful: " + response.data);
        }
    } catch (error) {
        console.error("Error making request: ", error);
        throw error;
    }
}

const createTransaction = (dataToSend) => {
    return makeRequest('post', '/api/public/transactions/create-transaction', dataToSend);
};

const valutes = () => {
    return makeRequest('get', '/api/public/valutes');
};

const crossRatesList = () => {
    return makeRequest('get', '/api/public/cross-rates');
};

const updateOrder = (data) => {
    if (!data.id) throw new Error("Не задан ID заявки");
    return makeRequest('post', `/api/public/transactions/${data.id}`, { step: data.status });
}

const getOrder = (id) => {
    if (!id) throw new Error("Не задан ID заявки");
    return makeRequest('get', `/api/public/transactions/get-transaction/${id}`);
}

module.exports = { createTransaction, valutes, crossRatesList, getOrder, updateOrder };
