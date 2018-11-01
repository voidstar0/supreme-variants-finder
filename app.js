const axios = require('axios')
const axiosRetry = require('axios-retry');
const fs = require('fs');

axiosRetry(axios, { retries: 3 });

//mobile user-agent header for checkout.json endpoint
const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/603.1.23 (KHTML, like Gecko) Version/10.0 Mobile/14E5239e Safari/602.1'
    }
}

const getCheckoutData = (largestSize, amount) => {
    let items = {};
    for(let i = largestSize + 1; i < largestSize + amount; i++) {
        items[i] = 1;
    }

    const cooksub = encodeURIComponent(JSON.stringify(items).replace(/'/g, '"'));

    const usCheckoutData = {
        'store_credit_id': '',
        'from_mobile': '1',
        'cookie-sub': cooksub,
        'same_as_billing_address': '1',
        'order[billing_name]': 'Blah Blah',
        'order[email]': 'blah@gmail.com',
        'order[tel]': '3472002000',
        'order[billing_address]': '1000 Cool Place',
        'order[billing_address_2]': 'Apt 2A',
        'order[billing_zip]': '10101',
        'order[billing_city]': 'NYC',
        'order[billing_state]': 'NY',
        'order[billing_country]': 'USA',
        'credit_card[cnb]': '4128 2000 3000 4000',
        'credit_card[month]': '01',
        'credit_card[year]': '2020',
        'credit_card[rsusr]': '302',
        'order[terms]': '1'
    };

    return usCheckoutData; 
}

//get the last item id from latest drop (largest id)
const getLargestItemID = async (region) => {
    const res = await axios.get('https://supremenewyork.com/mobile_stock.json');
    const data = await res.data;
    const products_and_categories = data['products_and_categories'];

    let largestProductID = 0;

    if(region === 'us') {
        largestProductID = products_and_categories['new'].map(p => p.id).reduce((a, b) => Math.max(a, b))
        largestProductID = await getLargestSizeID(largestProductID);
        console.log(`Largest size ID updated to: ${largestProductID}`);
    } else {
        for (let category in products_and_categories) {
            for (let item of products_and_categories[category]) {
                let sizeId = await getLargestSizeID(item['id']);
                if (sizeId > largestProductID) {
                    console.log(`Largest size ID updated to: ${sizeId}`);
                    largestProductID = sizeId;
                }
            }
        }
    }
    
    return largestProductID;
}   

//get largest size id
const getLargestSizeID = async (largestItemID) => {
    const res = await axios.get(`https://supremenewyork.com/shop/${largestItemID}.json`);
    const data = await res.data;

    const lastProduct = data.styles[data.styles.length - 1]
    const lastProductID = lastProduct.sizes[lastProduct.sizes.length - 1].id;
    
    return lastProductID;
}

const fetchVariants = async (largestSizeID, region, amount) => {
    try {
        const res = await axios.post('https://www.supremenewyork.com/checkout.json', getCheckoutData(largestSizeID, amount), options);
        const data = await res.data;

        let variants = [];
        if(data.status == 'outOfStock') {
            for(let variant in data.mp) {
                variants.push({
                    'Product Name': data.mp[variant]['Product Name'],
                    'Product Color': data.mp[variant]['Product Color'],
                    'Product Size': data.mp[variant]['Product Size'],
                    'Product ID': parseInt(largestSizeID) + parseInt(variant)
                })
            }
        }
        return variants;
    } catch(err) {
        return [];
    }
}

(async () => {
    const args = process.argv;
    let region = "us";

    if(args.length > 2) {
        if(args[2].toLowerCase() === 'us' || args[2].toLowerCase() === 'eu') {
            region = args[2].toLowerCase();
            console.log(`Region set to ${region}`)
        }
    } else if(args.length <= 2) {
        console.log('Region defaulting to US. ')
    }

    const id = await getLargestItemID(region);
    const variants = await fetchVariants(id, region, 500);

    console.log(variants.length === 0 ? 'No new variants found.' : variants.length + ' new variants have been found.')
    if(variants.length > 0) {
        fs.writeFile('output.json', JSON.stringify(variants,null,2), { flag: 'wx' }, (err) => {
            if (err) 
                return console.log(err);

            console.log(`Wrote ${variants.length} variants to output.json`);
        });
    }
})();