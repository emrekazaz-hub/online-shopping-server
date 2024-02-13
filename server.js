const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const knex = require('knex');

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
    const { userEmail, userPassword, userName } = req.body;

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


/// LoginPage - sign up
app.post('/login/signup', (req, res) => {
    const { userEmail, userPassword, userName } = req.body;
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
                    })
                    .then(() => {
                        const user = { name: userName, email: userEmail }
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
                res.json({ status: 'cardtrue' })
            } else {
                res.json({ status: 'cardfasle' })
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

// HomePage
app.get("/", (req, res) => {
    res.send(usersDb);
});

app.listen(3000, () => {
    console.log('app is running on port 3000');
});