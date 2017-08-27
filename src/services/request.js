var axios = require("axios");

axios.defaults.headers.common["Accept"] = "application/json";

module.exports = instance = axios.create({
  baseURL: 'http://localhost:8080/',
  timeout: 2000
});
