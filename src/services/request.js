var axios = require("axios");

module.exports = instance = axios.create({
  baseURL: 'http://localhost:8080/',
  timeout: 2000
});
