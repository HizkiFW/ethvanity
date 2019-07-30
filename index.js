const Web3 = require('web3');
const fs = require('fs');

const web3 = new Web3();

let n = 0;
while(true) {
    n++;

    // Create account
    const acc = web3.eth.accounts.create();

    if(n % 50 == 0)
        console.log(`[${n}] ${acc.address} (${acc.privateKey})`);

    if(acc.address.match(/0x(ba1dbeef|deadbeef|foodbeef|beefbabe|c0ldbeef|foodbabe|beefdead|(0{5,}|1{5,}|2{5,}|3{5,}|4{5,}|5{5,}|6{5,}|7{5,}|8{5,}|9{5,}|a{5,}|b{5,}|c{5,}|d{5,}|e{5,}|f{5,})).*/gi)) {
        console.log('Found a nice address!\n')

        fs.appendFileSync('keys.csv', `${acc.address},${acc.privateKey}\n`);
    }
}
