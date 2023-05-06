const express = require('express');
const app = express();
const router = express.Router();
const ejs = require('ejs');
const cors = require('cors');
const port = parseInt(process.env['PORT']);
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const sessions = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const saltRound = parseInt(process.env['SALTROUND']);

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static(path.join(__dirname, "/views")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
const oneDay = 1000 * 60 * 60 * 24;
const sevenDay = 1000 * 60 * 60 * 24 * 7;

app.use(sessions({
    secret: process.env['SECRET'],
    saveUninitialized:true,
    cookie: { maxAge: oneDay},
    resave: false 
}));
app.use(cookieParser());
app.use(router)


router.get('/', (req, res) => {
    if(req.session.access){
        res.redirect("/view")
    }else{
        res.render('index');
    }
});

/*
You can replace this section with MongoDB or other database to make your data private
*/
const user = {
    create:(username, password,req,res)=>{
        //save username and password to user.json
        fs.readFile('./user.json', 'utf-8', (err, data) => {
            if(err){
                console.log(err);
            }else{
                const userJsonFile = JSON.parse(data);
                //check is this username is exits
                const result = userJsonFile.find((item) => {
                    if(item.username == username){
                       return res.json({status:"err", msg:"Username is already exits!"});
                    }else{
                        const newUser = {
                            uid: userJsonFile.length + 1,
                            username: username,
                            password: bcrypt.hashSync(password, saltRound)
                        }
                        userJsonFile.push(newUser);
                        fs.writeFile('./user.json', JSON.stringify(userJsonFile), (err) => {
                            if(err){
                                console.log(err);
                            }else{
                                console.log('create user successfully');
                                res.redirect("/")
                                //for ajax response
                                //res.json({status:"ok", msg:"User registered!"})
                            }
                        });
                    }
                })
            }
        })

    },
    check:async (username, hashPassword, req, res)=>{
        //check if username and password is correct
        fs.readFile('./user.json', 'utf-8', (err, data) => {
            if(err){
                console.log(err);
            }else{
                const userJsonFile = JSON.parse(data);
                const result = userJsonFile.find((item) => {
                    return item.username == username;
                });
                if(result){
                    const checkPassword = bcrypt.compareSync(hashPassword, result.password);
                    if(checkPassword){
                        console.log("password match!!")
                        console.log("login successful")
                        
                        
                        req.session.access = true;
                        req.session.user = username;
                        console.log(req.session)
                        res.redirect("/view")
                        //for ajax response
                        //res.json({status:"ok", msg:"Login successful"})
                    }else{
                        console.log("Password do not match!!!")
                        res.redirect("/")
                        //for ajax response
                        //res.json({status:"err", msg:"Password incorrect!"})
                    }
                }else{
                    console.log("User not found!!!")
                    res.redirect("/")
                    //for ajax response
                    //res.json({status:"err", msg:"User not found!"})
                }
            }
        });
    }
};
/*
You can replace this section with MongoDB or other database to make your data private
*/

router.post('/login',async (req, res) => {
    //create express session 
    const username = req.body.username;
    const hashPassword = req.body.password;
    const check = await user.check(username, hashPassword, req, res);
});

router.get("/register", (req, res) => {
    res.render('register');
})

router.post("/createuser", (req, res) => {
    const {username , password} = req.body;
    user.create(username, password,req,res);
})

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
    const owner = req.session.user;
    fs.readFile('./redirect.json', 'utf-8', (err, data) => {
        if(err){
            console.log(err);
        }else{
            const redirectJsonFile = JSON.parse(data);
            const result = redirectJsonFile.filter((item) => {
                return item.owner == owner;
            });
            res.render('view', {urls: result, username:owner});
        }
    });
});

router.get('/add', accessCheck, (req, res) => {
    res.render('add');
})

router.post('/create', accessCheck, (req, res) => {
    const originalUrl = req.body.originalUrl;
    const shortenUrl = req.body.shortenUrl;
    const createAt = new Date();
    const owner = req.session.user;
    
    const newUrl = {
        original_url: originalUrl,
        shorten_url: shortenUrl,
        create_at: createAt,
        owner: owner,
        clicked:0,
        adsTime:0
    };
    fs.readFile('./redirect.json', 'utf-8', (err, data) => {
        if (err) {
            console.log(err);
        } else {
            
            const redirectJsonFile = JSON.parse(data);
            //check if shortenUrl is exist do nothing
            const result = redirectJsonFile.find((item) => {
                return item.shorten_url == shortenUrl;
            });
            if(result){
                res.redirect('/view');
                return;
            }
            redirectJsonFile.push(newUrl);
            
            fs.writeFile('./redirect.json', JSON.stringify(redirectJsonFile), (err) => {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/view');
                }
            });
        }
    });
});

router.post('/delete', accessCheck, (req, res) => {
    const shortenUrl = req.body.shorten_url;
    console.log(`Want to delete ${shortenUrl}`)
    fs.readFile('./redirect.json', 'utf-8', (err, data) => {
        if (err) {
            console.log(err);
        } else {
            const redirectJsonFile = JSON.parse(data);
            const result = redirectJsonFile.filter((item) => {
                return item.shorten_url != shortenUrl;
            });
            fs.writeFile('./redirect.json', JSON.stringify(result), (err) => {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/view');
                }
            });
        }
    });
});

router.get('/url', (req, res) => {
    const desurl = "https://google.com";
    res.render('url', {des_url:desurl});
});

router.get('/:shortUrl', (req, res) => {
    const shortUrl = req.params.shortUrl;
    fs.readFile('./redirect.json', 'utf-8', (err, data) => {
        if(err){
            console.log(err);
        }else{
            const redirectJsonFile = JSON.parse(data);
            const result = redirectJsonFile.find((item) => {
                if(item.shorten_url == shortUrl){
                    item.clicked++;
                    item.adsTime = item.clicked * 500;
                return true;
                }
            });
            if(result){
                fs.writeFile('./redirect.json', JSON.stringify(redirectJsonFile), (err) => {
                    if(err){
                        console.log(err);
                    }else{
                        console.log('update clicked successfully');
                    }
                });
                res.render('url', {des_url:result.original_url});
            }else{
                res.redirect('/');
            }
        }
    });
});

const server = app.listen(port, ()=>{
    const host = server.address().address;
    console.log(`App is running on ${host == "::" ? "http://localhost" : host}:${port}`)
})