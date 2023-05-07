const express = require('express');
const app = express();
const router = express.Router();

const fs = require('fs');
const ejs = require('ejs');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const sessions = require('express-session');
const cookieParser = require('cookie-parser');

const dotenv = require('dotenv');
dotenv.config();


app.set('view engine', 'ejs');
app.set('views', './views');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/views")));
app.use(cookieParser());


const saltRound = process.env.SALTROUND || 10;
const port = process.env.PORT || 5001;
const oneDay = 1000 * 60 * 60 * 24;
const sevenDay = 1000 * 60 * 60 * 24 * 7;
app.use(sessions({
    secret: process.env.SECRET || "URLSHORTHENER",
    saveUninitialized:true,
    cookie: { maxAge: oneDay},
    resave: false 
}));
app.use(router)

const { User, redirectURL } = require('./mongoCommands');

router.get('/', (req, res, next) => {
    console.log("index");
    res.render('index');
    next();
    () => {if(req.session.access) return res.redirect('/view');}
});
  
router.post('/login', (req, res) => {
    console.log("login");
    const { username, password } = req.body;
    User.login(username, password, req, res);
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/createuser', (req, res) => {
    const { username, password } = req.body;
    User.create(username, password, req, res);
});

router.get("/logout", (req, res) => {
    const user = req.session.user;
    req.session = req.session.destroy();
    console.log(`User : ${user} has logged out!!`)
    res.redirect("/");
})

const accessCheck = (req, res, next) =>{
    const access = req.session.access;
    if(access){
        next();
    }else{
        res.redirect('/');
    }
}

router.get('/view', accessCheck, (req, res) => {
    const user = req.session.user;
    const result = redirectURL.viewByUser(user);
    result.then((data) => {
        res.render('view', { urls: data, username: user });
    }).catch((err) => {
        console.log(err);
        res.json({ status: "err", msg: "Something went wrong!" });
    });
});

router.post('/add', accessCheck, (req, res) => {
    const { originalUrl, shortenUrl } = req.body;
    const user = req.session.user;
    redirectURL.create(originalUrl, shortenUrl, req, res);
});

router.post('/delete', accessCheck, (req, res) => {
    const shortenUrl = req.body.shorten_url;
    redirectURL.delete(shortenUrl, req, res);
});

router.post('/update', accessCheck, (req, res) => {
    const { originalUrl, shortenUrl } = req.body;
    redirectURL.update(originalUrl, shortenUrl, req, res);
});

router.get('/:shortenUrl', (req, res) => {
    const shortenUrl = req.params.shortenUrl;
    redirectURL.redirect(shortenUrl, req, res);
});

const server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
}); 