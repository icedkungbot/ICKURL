const {
    MongoClient
} = require("mongodb");
// Replace the uri string with your connection string.
const uri = process.env.MONGO_URI || "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const client = new MongoClient(uri, {
    serverApi: {
        version: "ServerApiVersion.v1",
        strict: true,
        deprecationErrors: true,
    }
});
const bcrypt = require('bcrypt');
const saltRound = process.env.SALTROUND || 10;


/*
  {
  "_id": {
    "$oid": "645778e0727e3536dd619572"
  },
  "uid": 1,
  "username": "ickdev",
  "password": "$2b$15$kbZbIB18Zt40LtU375vWiuD4VaQzwce4MPN9LfBuspDhuSa5SYGKm"
}
  */
const User = {
    create: (username, password, req, res) => {
        //save username and password to user.json
        client.connect(err => {
            const collection = client.db("account").collection("user");
            // perform actions on the collection object
            collection.find({
                username: username
            }).toArray((err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    if (result.length > 0) {
                        res.json({
                            status: "err",
                            msg: "Username is already exits!"
                        })
                    } else {
                        const newUser = {
                            uid: result.length + 1,
                            username: username,
                            password: bcrypt.hashSync(password, saltRound)
                        }
                        collection.insertOne(newUser, (err, result) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('create user successfully');
                                res.redirect("/")
                                //for ajax response
                                //res.json({status:"ok", msg:"User registered!"})
                            }
                        })
                    }
                }
            });
            client.close();
        });
    },
    login: async (username, password, req, res) => {
        client.connect(err => {
            const collection = client.db("account").collection("user");
            // perform actions on the collection object
            collection.find({
                username: username
            }).toArray((err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    if (result.length == 0) {
                        res.json({
                            status: "err",
                            msg: "Username is not exits!"
                        })
                    } else {
                        const checkPassword = bcrypt.compareSync(password, result[0].password);
                        if (checkPassword) {
                            console.log("password match!!")
                        console.log("login successful")
                        
                        
                        req.session.access = true;
                        req.session.user = username;
                        console.log(req.session)
                        res.redirect("/view")
                        } else {
                            console.log("Password incorrect!")
                        res.redirect("/")
                        }
                    }
                }
            })
            client.close();
        });
    }
}

/*
{
  "_id": {
    "$oid": "64577944727e3536dd619579"
  },
  "original_url": "https://www.youtube.com/watch?v=TcLz34_G0u8",
  "shorten_url": "yt",
  "create_at": "2023-05-05T19:00:32.568Z",
  owner: owner,
  clicked:0,
  adsTime:0
}
*/
const redirectURL = {
        viewALL: () => {
            //get all shorten url 
            client.connect(err => {
                const collection = client.db("account").collection("redirect");
                // perform actions on the collection object
                collection.find({}).toArray((err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        return result;
                    }
                })
                client.close();
            });
        },
        viewByUser: (username) => {
            //get all shorten url by username
            client.connect(err => {
                const collection = client.db("account").collection("redirect");
                // perform actions on the collection object
                collection.find({
                    owner: username
                }).toArray((err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        return result;
                    }
                })
                client.close();
            });
        },
        viewByShorten: (shortenUrl) => {
            //get all shorten url by shorten url
            client.connect(err => {
                const collection = client.db("account").collection("redirect");
                // perform actions on the collection object
                collection.find({
                    shorten_url: shortenUrl
                }).toArray((err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        return result;
                    }
                })
                client.close();
            });
        },
        viewByOriginal: (originalUrl) => {
            //get all shorten url by original url
            client.connect(err => {
                const collection = client.db("account").collection("redirect");
                // perform actions on the collection object
                collection.find({
                    original_url: originalUrl
                }).toArray((err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        return result;
                    }
                })
                client.close();
            });
        },
        create: (originalUrl, shortenUrl, req, res) => {
            //save shorten url to shorten.json

            client.connect(err => {
                const collection = client.db("account").collection("redirect");
                // perform actions on the collection object
                collection.find({
                    shorten_url: shortenUrl
                }).toArray((err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        if (result.length > 0) {
                            res.json({
                                status: "err",
                                msg: "Shorten URL is already exits!"
                            })
                        } else {
                            const newShortenUrl = {
                                id: result.length + 1 + owner,
                                original_url: originalUrl,
                                shorten_url: shortenUrl,
                                create_at: new Date(),
                                owner: owner,
                                clicked: 0,
                                adsTime: 0
                            }

                            collection.insertOne(newShortenUrl, (err, result) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('create shorten url successfully');
                                    res.redirect("/view")
                                    //for ajax response
                                    //res.json({status:"ok", msg:"Shorten URL created!"})
                                }
                            })
                        }
                    }
                });
                client.close();
            });
        },
        delete: (shortenUrl, req, res) => {
            //delete shorten url from shorten.json
            const owner = req.session.user;
            client.connect(err => {
                const collection = client.db("account").collection("redirect");
                // perform actions on the collection object
                collection.deleteOne({
                    shorten_url: shortenUrl,
                    owner: owner
                }, (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('delete shorten url successfully');
                        res.redirect("/view")
                        //for ajax response
                        //res.json({status:"ok", msg:"Shorten URL deleted!"})
                    }
                })
                client.close();
            });

        },
        update: (shortenUrl, newShortenUrl, req, res) => {
            //update shorten url from shorten.json
            const owner = req.session.user;
            client.connect(err => {
                const collection = client.db("account").collection("redirect");
                // perform actions on the collection object
                collection.updateOne({
                    shorten_url: shortenUrl,
                    owner: owner
                }, {
                    $set: {
                        shorten_url: newShortenUrl
                    }
                }, (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('update shorten url successfully');
                        res.redirect("/view")
                        //for ajax response
                        //res.json({status:"ok", msg:"Shorten URL updated!"})
                    }
                })
                client.close();
            });
        },
        redirect: (shortenUrl, username, req, res) => {
                const collection = client.db("account").collection("redirect");
                // perform actions on the collection object
                collection.find({
                        shorten_url: shortenUrl
                    }).toArray((err, result) => {
                            if (err) {
                                console.log(err);
                            } else {
                                result.clicked += 1;
                                result.adsTime = result.clicked * 5;
                                collection.updateOne({
                                    shorten_url: shortenUrl
                                }, {
                                    $set: {
                                        clicked: result.clicked,
                                        adsTime: result.adsTime
                                    },
                                }, (err, result) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log('update shorten url successfully');
                                        res.render('url', {des_url:result.original_url});
                                        //for ajax response
                                        //res.json({status:"ok", msg:"Shorten URL updated!"})
                                    }
                                });
                            }
                        })
                        client.close();
            },
            view: (shortenUrl, username, req, res) => {
                const collection = client.db("account").collection("redirect");
                const owner = username;
                // perform actions on the collection object
                collection.find({
                    shorten_url: shortenUrl,
                    owner: owner
                }).toArray((err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        return result;
                    }
                })
                client.close();
            }
}
module.exports = {User, redirectURL};
