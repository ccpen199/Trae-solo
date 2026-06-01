const http = require('http');

http.get('http://127.0.0.1:56777/api/listings/3', res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const d = JSON.parse(data);
    const l = d.listing;
    console.log('=== Car Listing ID=3 ===');
    console.log('title:', l.title);
    console.log('merchant_name:', l.merchant_name);
    console.log('business_license:', l.business_license);
    console.log('total_deals:', l.total_deals);
    console.log('response_rate:', l.response_rate);
    console.log('is_approved:', l.is_approved);
    console.log('fraud_check:', JSON.stringify(l.fraud_check));
  });
});
