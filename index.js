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


const saltRound = parseInt(process.env.SALTROUND) || 10;
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
    res.render('add_guest');
    next();
    () => {if(req.session.access) return res.redirect('/view');}
});

router.get('/healthz', (req,res)=>{
    return res.status(200).json({status:"ok", msg:"Server is running!"});
})

router.get('/auth', (req, res, next) => {
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
    res.end();
})

const accessCheck = (req, res, next) =>{
    const access = req.session.access;
    if(access){
        next();
    }else{
        res.redirect('/auth');
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

router.get('/preview/:shortenUrl', async(req, res) => {
    const url = req.params.shortenUrl || 'not found';
    console.log("URL => ", url)
    if(url != 'not found'){
        const data = await redirectURL.viewByShorten(url);
        console.log("Preview data => ", data)
        res.render('preview', {data:data[0]});
    }else{
        res.render('add_guess');
    }
});

router.get('/add', accessCheck, (req, res) => {
   res.render('add');
});

router.post('/create', accessCheck,async (req, res) => {
    const { originalUrl, shortenUrl } = req.body;
    let title;
    let desc;
    let img;
    let r_time;
    
    if(!req.body.title){
        title = "ICKURL";
    }else{
        title = req.body.title;
    }

    if(!req.body.desc){
        desc = "Forever free url shortener for your sharing | Made with love by ICKDEV";
    }else{
        desc = req.body.desc;
    }

    if(!req.body.img){
        img = "https://cdn.discordapp.com/attachments/885089951207804949/907257498069794856/Ickstaycoding.png";
    }else{
        img = req.body.img;
    }

    if(!req.body.r_time){
        r_time = 0;
    }else{
        r_time = req.body.r_time;
    }

    try{
        await redirectURL.create(originalUrl, shortenUrl,title, desc, img ,r_time , req, res);
    res.status(200).json({status:"success", msg:"URL has been shorten!", shortenUrl:shortenUrl});

    }catch(err){
        console.log(err);
        res.status(500).json({status:"err", msg:"Something went wrong!"});
    }
});

router.post('/create_guest', async (req, res) => {
    const { originalUrl, shortenUrl } = req.body;
    let title;
    let desc;
    let img;
    let r_time;
    
    if(!req.body.title){
        title = "ICKURL";
    }else{
        title = req.body.title;
    }

    if(!req.body.desc){
        desc = "Forever free url shortener for your sharing | Made with love by ICKDEV";
    }else{
        desc = req.body.desc;
    }

    if(!req.body.img){
        img = "https://cdn.discordapp.com/attachments/885089951207804949/907257498069794856/Ickstaycoding.png";
    }else{
        img = req.body.img;
    }

    if(!req.body.r_time){
        r_time = 0;
    }else{
        r_time = req.body.r_time;
    }
    try{
        await redirectURL.create(originalUrl, shortenUrl,title, desc, img ,r_time , req, res);
        // res.redirect(`/preview/${shortenUrl}`)
        res.status(200).json({status:"success", msg:"URL has been shorten!", shortenUrl:shortenUrl});
    
    }catch(err){
        console.log(err);
        res.status(500).json({status:"err", msg:"Something went wrong!"});
    }
});

router.post('/delete', accessCheck, (req, res) => {
    const shortenUrl = req.body.shorten_url;
    redirectURL.delete(shortenUrl, req, res);
});

router.post('/update', accessCheck, (req, res) => {
    const { originalUrl, shortenUrl } = req.body;
    redirectURL.update(originalUrl, shortenUrl, req, res);
});

router.get('/:shortenUrl',async (req, res) => {
    
    try{
        const shortenUrl = req.params.shortenUrl;
        const data = await redirectURL.redirect(shortenUrl, req, res);
    if(data){
        res.render('url', { s_url:data.shorten_url,des_url: data.original_url, title: data.title, desc: data.desc, img: data.img, r_time: data.r_time });
    }else{
        res.render("add_guest");
    }
    }catch(err){
        console.log(err);
        res.render("add_guest");
    }
});

const server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
}); 
