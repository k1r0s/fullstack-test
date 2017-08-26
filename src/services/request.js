var axios = require("axios");

module.exports = instance = axios.create({
  baseURL: 'http://localhost:3000/',
  timeout: 1000
});
