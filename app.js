const axios = require('axios')

//mobile user-agent header for checkout.json endpoint
const options = {
    headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/603.1.23 (KHTML, like Gecko) Version/10.0 Mobile/14E5239e Safari/602.1"
    }
}

//fake checkout data to send to supreme
const getCheckoutData = (id) => {
    const cooksub = encodeURIComponent(`{"${id}":1}`);
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

let largestID = -1
let largestSizeID = -1;

//get the last item id from latest drop (largest id)
const setLargestID = () => {
    if(largestID == -1) {
        return axios.get('https://supremenewyork.com/mobile_stock.json').then((res) => {
            const newProducts = res.data['products_and_categories']['new'];
            for(let product of newProducts) {
                if(product.id > largestID)
                    largestID = product.id;
            }
            console.log(`Largest ID found ${largestID}`)
        })
    }
}

//get biggest size id
const setLargestSizeID = () => {
    if(largestSizeID == -1) {
        return axios.get(`https://supremenewyork.com/shop/${largestID}.json`).then((res) => {
            const newProducts = res.data;
            const lastProduct = newProducts.styles[newProducts.styles.length - 1];
            const lastProductID = lastProduct.sizes[lastProduct.sizes.length - 1].id;
            largestSizeID = lastProductID;
            console.log(`Largest Size ID found ${lastProductID}`)
        })
    }
}

//checkout with the id passed.
const postWithID = (id) => {
    axios.post('https://www.supremenewyork.com/checkout', getCheckoutData(id), options).then((res) => {
        let data = res.data;
        //if out of stock - item exists and variant is found
        if(data.status == 'outOfStock') {
            console.log(`Found item ${data.mp[0]['Product Name']} - ${data.mp[0]['Product Color']} - ${data.mp[0]['Product Size']} - ID:${id}`)
        }
    }).catch(err => console.log(`${largestSizeID} not an item.`));
}

//check delay in ms
let delay = 500;

setLargestID().then(() => {
    setLargestSizeID().then(() => {
        setInterval(() => {
            postWithID(largestSizeID++)
        }, delay)
    })
})
