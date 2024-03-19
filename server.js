const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const knex = require('knex');
const fs = require('fs');
const path = require('path');

const database = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        port: 5432,
        user: 'postgres',
        password: '2013',
        database: 'webstore'
    }
});

database.select('*').from('users')
    .then(data => {
    });

const app = express();
app.use(bodyParser.json());
app.use(cors());

function generateJWT(user) {
    return jwt.sign(user, 'your_secret_key', { expiresIn: '1h' });
}

// Database - will be deleted on next time ^^
const usersDb = [
    {
        userId: 4,
        userName: 'deneme123',
        userPassword: '123',
        userEmail: '123@123',
        userCard: {
            userCardId: '',
            userCardName: '',
            userCardNumber: '',
            userCardMonth: '',
            userCardYear: '',
            userCardCvv: '',
            userCardType: '',
        }
    },
    {
        userId: 5,
        userName: '123',
        userPassword: '123',
        userEmail: '123@123',
        userCard: {
            userCardId: '',
            userCardName: '',
            userCardNumber: '',
            userCardMonth: '',
            userCardYear: '',
            userCardCvv: '',
            userCardType: '',
        }
    },
    {
        userId: 6,
        userName: 'a',
        userPassword: 'a',
        userEmail: 'a@a',
        userCard: {
            userCardId: 66,
            userCardName: 'deneme',
            userCardNumber: 666,
            userCardMonth: 60,
            userCardYear: 2066,
            userCardCvv: 6666,
            userCardType: '',
        }
    },
];


// database login
app.post('/login/signin', (req, res) => {
    const { userEmail } = req.body;

    database('users')
        .select('*')
        .from('users')
        .where('email', userEmail)
        .then(existingUsers => {
            if (existingUsers.length === 0) {
                console.log('User not found', existingUsers);
                res.json({ status: 'error' });
            } else {
                const user = existingUsers[0]; // get firs user (there will be only one user with same information for that reason we can simply get the first one)
                res.json({ status: 'success', user });
            }
        })
        .catch(error => {
            console.error('error while searching user', error);
            res.status(500).json({ error: 'error while searching user' });
        });
});

// Search Products
app.post('/search/products', (req, res) => {
    const { searchboxitem } = req.body;

    database('products')
        .select('*')
        .from('products')
        .where('productname', 'like', '%' + searchboxitem + '%')
        .then(product => {
            if (product.length !== 0) {
                res.json({ status: 'success', product })
            } else {
                res.json({ status: 'failed' })
            }
        })
})

/// LoginPage - sign up
app.post('/login/signup', (req, res) => {
    const { userEmail, userPassword, userName, isCheckBoxSelected } = req.body;
    database('users')
        .select('*').from('users').where('email', userEmail)
        .then(existingUser => {
            console.log(existingUser);
            if (existingUser.length > 0) {
                console.log('kullanici mevcut');
                console.log('mevcut kullanicinin bilgileri : ', existingUser);
                res.json({ status: 'existingUser' });
            }
            else {
                database('users')
                    .insert({
                        name: userName,
                        email: userEmail,
                        password: userPassword,
                        role: isCheckBoxSelected
                    })
                    .then(() => {
                        const user = { name: userName, email: userEmail, role: isCheckBoxSelected }
                        res.json({ status: 'addUser', user });
                        console.log('kullanici eklendi')
                    })
                    .catch(err => {
                        console.log('error while adding to database', err);
                    })
            }
        })
});


app.get('/cardpayment/:userId', (req, res) => {
    const userId = req.params.userId;

    database('paymentcard')
        .select('*')
        .from('paymentcard')
        .where('userid', userId)
        .then(cardInfo => {
            if (cardInfo.length > 0) {
                res.json({ status: 'cardtrue', cardInfo })
                console.log('veri tabaninda kart bulundu :', cardInfo)
            } else {
                res.json({ status: 'cardfalse' })
                console.log('veri tabaninda kart bulunamadi')
            }
        })


        .catch(error => {
            console.error('Error fetching card information:', error);
            res.status(500).json({ error: 'Error fetching card information' });
        });
});


// UserCard (new card)
app.post('/profile/cardpayment-new/:userId', (req, res) => {
    const { userCardName, userCardNumber, userCardMonth, userCardYear, userCardCvv, userCardType } = req.body;
    const userId = req.params.userId;
    console.log('frontendden gelen user id : ', userId);

    database('paymentcard')
        .insert({
            userid: userId,
            cardnamedb: userCardName,
            cardnumberdb: userCardNumber,
            cardmonthdb: userCardMonth,
            cardyerdb: userCardYear,
            cardcvvdb: userCardCvv,
            cardtypedb: userCardType
        })
        .then(() => {
            const newCardOfUser = {
                cardnamedb: userCardName,
                cardmonthdb: userCardMonth,
                cardyerdb: userCardYear,
                cardcvvdb: userCardCvv,
                cardtypedb: userCardType
            }
            // Doğru şekilde JSON yanıtı döndür
            res.status(200).json({ status: 'addnewcard', newCardOfUser });
        })
        .catch(err => {
            console.log('An error occurred while adding a card', err);
            // Hata durumunda uygun yanıtı döndür
            res.status(500).json({ status: 'erraddcard' });
        });
});

app.get('/cardpaymentdelete/:userId', (req, res) => {
    const userId = req.params.userId;
    console.log('gelen user id :', userId);
    database('paymentcard')
        .where('userid', userId)
        .delete()
        .then(() => {
            res.json({ status: 'success-delete' });
        })
        .catch(err => {
            console.error('Error while deleting payment card:', err);
            res.status(500).json({ status: 'error-delete' });
        });
});


// set new adres
app.post('/profile/adress-new/:userId', (req, res) => {
    const { userEmail, userAdress, userAdress2, userCity, userAdressState, userZip } = req.body;
    const userId = req.params.userId;

    database('adress')
        .insert({
            userid: userId,
            email: userEmail,
            adress: userAdress,
            adress2: userAdress2,
            city: userCity,
            adress_state: userAdressState,
            zip: userZip
        })
        .then(() => {
            const newAdressOfUser = {
                userid: userId,
                email: userEmail,
                adress: userAdress,
                adress2: userAdress2,
                city: userCity,
                adress_state: userAdressState,
                zip: userZip
            }
            res.json({ status: 'adress-success', newAdressOfUser });
        })
        .catch(err => {
            res.status(500).json({ status: 'erraddadress' });
        })

});



// get user adress
app.get('/profile/adress/:userId', (req, res) => {
    const userId = req.params.userId;

    database('adress')
        .select('*')
        .from('adress')
        .where('userid', userId)
        .then(adressInfo => {
            if (adressInfo.length > 0) {
                res.json({ status: 'adressGet', userAdress: adressInfo });
                console.log('Alinan adresler: ', adressInfo);
            } else {
                console.log('Adres bulunamadı');
                res.status(404).json({ status: 'noAdressFound' });
            }
        })
        .catch(err => {
            console.log('Hata mesaji', err);
            res.status(500).json({ status: 'adressCannotGet' });
        });
});


// add products
app.post('/profile/admin/addProduct/:userId', (req, res) => {
    const userId = req.params.userId;
    const { productName, productDescription, productPrice, productQuantity, selectedCategory, selectedSubCategory, productImage } = req.body;

    database('products')
        .insert({
            userid: userId,
            productname: productName,
            description: productDescription,
            price: productPrice,
            stock_quantity: productQuantity,
            category_name: selectedCategory,
            sub_category_name: selectedSubCategory,
            image_url: productImage
        })
        .then(() => {
            const product = {
                userid: userId,
                productname: productName,
                description: productDescription,
                price: productPrice,
                stock_quantity: productQuantity,
                category_name: selectedCategory,
                sub_category_name: selectedSubCategory,
                image_url: productImage
            }
            res.json({ status: 'productAdded', product });
            console.log('urun basariyla eklendi :', product);
        })
        .catch(err => {
            res.json({ status: 'productNotAdded', err });
            console.log(err);
        });

});


// get products for admin
app.get('/profile/admin/getProduct/:userId', (req, res) => {
    const userId = req.params.userId;

    database('products')
        .select('*')
        .from('products')
        .where('userid', userId)
        .then(product => {
            if (product !== 0) {
                const products = product
                res.json({ status: 'getProducts', products });
                //                console.log('alinan urunler : ', products);
            }
        })
        .catch(err => {
            res.json({ status: 'cannotGetProducts' });
            console.log('urunleri alirken hata olustu : ', err);
        })
})

// get product for normal user
app.get('/profile/getProduct/:userId', (req, res) => {
    const userId = req.params.userId;

    database('products')
        .select('*')
        .from('products')
        .then(product => {
            if (product !== 0) {
                const products = product
                res.json({ status: 'getProducts', products });
                //                console.log('alinan urunler : ', products);
            }
        })
        .catch(err => {
            res.json({ status: 'cannotGetProducts' });
            console.log('urunleri alirken hata olustu : ', err);
        })
})


// get purchased products for admin
app.get('/profile/admin/purchasedProducts/:userId', (req, res) => {
    const userId = req.params.userId;
    database('purchased_products')
        .select('*')
        .from('purchased_products')
        .where('adminid', userId)
        .then(isEmpty => {
            if (isEmpty !== 0) {
                const purchasedProducts = isEmpty;
                console.log('alinan satin alinmis itemler : ', purchasedProducts);
                console.log(userId);
                res.json({ status: 'getPurchasedProducts', purchasedProducts });
            }
        })
        .catch(err => {
            console.log('satilmis urunleri alirken hata oldu : ', err);
            res.json({ status: 'cannotGetPurchasedProducts', err });
        })
});


// buy and add to database by userid+adminid+productid
app.post('/profile/admin/purchasedProducts/:userId', (req, res) => {
    const userId = req.params.userId;
    const { sellerId, adminId, purchasedUser, purchasedUserEmail, productName, productPrice, productQuantity, selectedCategory } = req.body;

    database('purchased_products')
        .insert({
            userid: userId,
            adminid: sellerId,
            user_name: purchasedUser,
            user_email: purchasedUserEmail,
            product_name: productName,
            product_price: productPrice,
            product_quantity: productQuantity,
            category_name: selectedCategory,
            purchased_date: new Date()
        })
        .then(() => {
            const productOfAdmin = {
                userid: userId,
                adminid: sellerId,
                user_name: purchasedUser,
                user_email: purchasedUserEmail,
                product_name: productName,
                product_price: productPrice,
                product_quantity: productQuantity,
                category_name: selectedCategory,
                purchased_date: new Date()
            }
            res.json({ status: 'success', productOfAdmin })
        })
        .catch(err => console.log('server error adding database :', err))

});


// get photos for carosel



// get role from db
app.get('/role/:userId', (req, res) => {
    const userId = req.body.params;

});

// HomePage
app.get("/", (req, res) => {
    res.send(usersDb);
});

app.listen(3000, () => {
    console.log('app is running on port 3000');
});