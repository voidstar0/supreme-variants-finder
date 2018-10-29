const axios = require('axios')
const axiosRetry = require('axios-retry');
 
axiosRetry(axios, { retries: 3 });

//mobile user-agent header for checkout.json endpoint
const options = {
    headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/603.1.23 (KHTML, like Gecko) Version/10.0 Mobile/14E5239e Safari/602.1"
    }
}

const getCheckoutData = (largestSize, amount) => {
    let items = {};
    for(let i = largestSize; i < largestSize + amount; i++) {
        items[i] = 1;
    }

    const cooksub = encodeURIComponent(JSON.stringify(items).replace(/'/g, '"'));

    return {
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
    }
}

//get the last item id from latest drop (largest id)
const getLargestItemID = async () => {
    const res = await axios.get('https://supremenewyork.com/mobile_stock.json');
    const data = await res.data;
    const newProducts = data['products_and_categories']['new'];

    let largestID = -1;
    for(let product of newProducts) {
        if(product.id > largestID)
            largestID = product.id;
    }
    
    console.log(`Largest ID: ${largestID}`);
    return largestID;
}

//get biggest size id
const getLargestSizeID = async (largestItemID) => {
    const res = await axios.get(`https://supremenewyork.com/shop/${largestItemID}.json`);
    const data = await res.data;

    const lastProduct = data.styles[data.styles.length - 1]
    const lastProductID = lastProduct.sizes[lastProduct.sizes.length - 1].id;
    
    console.log(`Largest Size ID Found: ${lastProductID}`);
    return lastProductID;
}

const fetchVariants = async (largestSizeID, amount) => {
    const res = await axios.post('https://www.supremenewyork.com/checkout', getCheckoutData(largestSizeID, amount), options);
    const data = await res.data;

    let variants = [];
    if(data.status == 'outOfStock') {
        for(let variant of data.mp) {
            variants.push({
                'Product Name': variant['Product Name'],
                'Product Color': variant['Product Color'],
                'Product Size': variant['Product Size'],
            })
        }
    }
    return variants;
}

(async () => {
    const largestItemID = await getLargestItemID();
    const largestSizeID = await getLargestSizeID(largestItemID);
    const variants = await fetchVariants(largestSizeID, 30);
    console.log(variants.length === 0 ? 'No new variants found.' : variants);
})();