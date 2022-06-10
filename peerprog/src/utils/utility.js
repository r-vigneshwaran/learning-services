exports.deleteSensitive = (data) => {
  delete data['rows'][0]['REFRESH_TOKEN'];
  delete data['rows'][0]['PASSWORD'];
  delete data['rows'][0]['OTP'];
  delete data['rows'][0]['CREATED_AT'];
  delete data['rows'][0]['EXPIRES_AT'];
  return data['rows'][0];
};
exports.required = (params) => {

};
