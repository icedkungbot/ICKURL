const {
    MongoClient
} = require("mongodb");
require('dotenv').config();
// Replace the uri string with your connection string.
const uri = process.env.MONGO_URI || "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const bcrypt = require('bcrypt');
const saltRound = process.env.SALTROUND || 10;

const User = {
    create:async (username, password, req, res) => {
        //save username and password to database
        try{
            await client.connect();
            const isExits = await client.db("account").collection("user").findOne({username:username});
            if(isExits == null){
                return res.json({status:"err", msg:"Username is already exits!"})
            //check is this username is exits
            }else{
                const allUser = await client.db("account").collection("user").find({}).toArray();
                const hashPassword = bcrypt.hashSync(password, saltRound);
                const newUser = {
                    uid: allUser.length + 1,
                    username: username,
                    password: hashPassword
                }
                await client.db("account").collection("user").insertOne(newUser);
                console.log(`User : ${username} has registered!`);
                res.redirect("/")
            }    
            // perform actions on the collection object
        }catch(err){
            console.log(err);
        }finally{
            client.close();
        }
            
    },
    login:async (username, password, req, res) => {
        try{
            await client.connect();
            const isExits = await client.db("account").collection("user").findOne({username:username});
            if(isExits == null){
                return res.json({status:"err", msg:"Username is not exits!"})
            }else{
                if(bcrypt.compareSync(password, isExits.password)){
                    console.log(req.session);
                    req.session.access = true;
                    req.session.user = username;
                    return res.redirect("/view")
                }else{
                    return res.json({status:"err", msg:"Password is not correct!"})
                }
            }
        }catch(err){
            console.log(err);
        }finally{
            await client.close();
        }
    }
}


const redirectURL = {
        viewALL:async () => {
            try{
                await client.connect();
                const result = await client.db("account").collection("redirect").find({}).toArray();
                return result;
            }catch(err){
                console.log(err);
            }finally{
                await client.close();
            }
        },
        viewByUser:async (username) => {

            try{
                await client.connect();
                const result = await client.db("account").collection("redirect").find({owner:username}).toArray();
                return result;
            }catch(err){
                console.log(err);
            }finally{
                await client.close();
            }
        },
        viewByShorten:async (shortenUrl) => {
            //get all shorten url by shorten url
            // client.connect(err => {
            //     const collection = client.db("account").collection("redirect");
            //     // perform actions on the collection object
            //     collection.find({
            //         shorten_url: shortenUrl
            //     }).toArray((err, result) => {
            //         if (err) {
            //             console.log(err);
            //         } else {
            //             return result;
            //         }
            //     })
            //     client.close();
            // });

            try{
                await client.connect();
                const result = await client.db("account").collection("redirect").find({shorten_url:shortenUrl}).toArray();
                return result;
            }catch(err){
                console.log(err);
            }finally{
                await client.close();
            }
        },
        viewByOriginal:async (originalUrl) => {
            //get all shorten url by original url
            // client.connect(err => {
            //     const collection = client.db("account").collection("redirect");
            //     // perform actions on the collection object
            //     collection.find({
            //         original_url: originalUrl
            //     }).toArray((err, result) => {
            //         if (err) {
            //             console.log(err);
            //         } else {
            //             return result;
            //         }
            //     })
            //     client.close();
            // });

            try{
                await client.connect();
                const result = await client.db("account").collection("redirect").find({original_url:originalUrl}).toArray();
                return result;
            }catch(err){
                console.log(err);
            }finally{
                await client.close();
            }
        },
        create:async (originalUrl, shortenUrl, req, res) => {
            //save shorten url to shorten.json

            // client.connect(err => {
            //     const collection = client.db("account").collection("redirect");
            //     // perform actions on the collection object
            //     collection.find({
            //         shorten_url: shortenUrl
            //     }).toArray((err, result) => {
            //         if (err) {
            //             console.log(err);
            //         } else {
            //             if (result.length > 0) {
            //                 res.json({
            //                     status: "err",
            //                     msg: "Shorten URL is already exits!"
            //                 })
            //             } else {
            //                 const newShortenUrl = {
            //                     id: result.length + 1 + owner,
            //                     original_url: originalUrl,
            //                     shorten_url: shortenUrl,
            //                     create_at: new Date(),
            //                     owner: owner,
            //                     clicked: 0,
            //                     adsTime: 0
            //                 }

            //                 collection.insertOne(newShortenUrl, (err, result) => {
            //                     if (err) {
            //                         console.log(err);
            //                     } else {
            //                         console.log('create shorten url successfully');
            //                         res.redirect("/view")
            //                         //for ajax response
            //                         //res.json({status:"ok", msg:"Shorten URL created!"})
            //                     }
            //                 })
            //             }
            //         }
            //     });
            //     client.close();
            // });

            try{
                await client.connect();
                const isExits = await client.db("account").collection("redirect").findOne({shorten_url:shortenUrl});
                if(isExits != null){
                    return res.json({status:"err", msg:"Shorten URL is already exits!"})
                }else{
                    const owner = req.session.user;
                    const newShortenUrl = {
                        id: isExits.length + 1 + owner,
                        original_url: originalUrl,
                        shorten_url: shortenUrl,
                        create_at: new Date(),
                        owner: owner,
                        clicked: 0,
                        adsTime: 0
                    }
                    await client.db("account").collection("redirect").insertOne(newShortenUrl);
                    console.log(`Shorten URL : ${shortenUrl} has created!`);
                    res.redirect("/view")
                }
            }catch(err){
                console.log(err);
            }finally{
                await client.close();
            }
        },
        delete:async (shortenUrl, req, res) => {
            //delete shorten url from shorten.json
            // const owner = req.session.user;
            // client.connect(err => {
            //     const collection = client.db("account").collection("redirect");
            //     // perform actions on the collection object
            //     collection.deleteOne({
            //         shorten_url: shortenUrl,
            //         owner: owner
            //     }, (err, result) => {
            //         if (err) {
            //             console.log(err);
            //         } else {
            //             console.log('delete shorten url successfully');
            //             res.redirect("/view")
            //             //for ajax response
            //             //res.json({status:"ok", msg:"Shorten URL deleted!"})
            //         }
            //     })
            //     client.close();
            // });

            try{
                await client.connect();
                const owner = req.session.user;
                await client.db("account").collection("redirect").deleteOne({shorten_url:shortenUrl, owner:owner});
                console.log(`Shorten URL : ${shortenUrl} has deleted!`);
                res.redirect("/view")
            }catch(err){
                console.log(err);
            }finally{
                await client.close();
            }
        },
        update:async (shortenUrl, newShortenUrl, req, res) => {
            //update shorten url from shorten.json
            // const owner = req.session.user;
            // client.connect(err => {
            //     const collection = client.db("account").collection("redirect");
            //     // perform actions on the collection object
            //     collection.updateOne({
            //         shorten_url: shortenUrl,
            //         owner: owner
            //     }, {
            //         $set: {
            //             shorten_url: newShortenUrl
            //         }
            //     }, (err, result) => {
            //         if (err) {
            //             console.log(err);
            //         } else {
            //             console.log('update shorten url successfully');
            //             res.redirect("/view")
            //             //for ajax response
            //             //res.json({status:"ok", msg:"Shorten URL updated!"})
            //         }
            //     })
            //     client.close();
            // });

            try{
                const owner = req.session.user;
                await client.connect();
                const isExits = await client.db("account").collection("redirect").findOne({shorten_url:shortenUrl, owner:owner});
                if(isExits == null){
                    return res.json({status:"err", msg:"Shorten URL is not exits!"})
                }else{
                    await client.db("account").collection("redirect").updateOne({shorten_url:shortenUrl, owner:owner}, {$set:{shorten_url:newShortenUrl}});
                    console.log(`Shorten URL : ${shortenUrl} has updated!`);
                    res.redirect("/view")
                }
            }catch(err){
                console.log(err);
            }finally{
                await client.close();
            }
        },
        redirect:async (shortenUrl, username, req, res) => {
                // const collection = client.db("account").collection("redirect");
                // // perform actions on the collection object
                // collection.find({
                //         shorten_url: shortenUrl
                //     }).toArray((err, result) => {
                //             if (err) {
                //                 console.log(err);
                //             } else {
                //                 result.clicked += 1;
                //                 result.adsTime = result.clicked * 5;
                //                 collection.updateOne({
                //                     shorten_url: shortenUrl
                //                 }, {
                //                     $set: {
                //                         clicked: result.clicked,
                //                         adsTime: result.adsTime
                //                     },
                //                 }, (err, result) => {
                //                     if (err) {
                //                         console.log(err);
                //                     } else {
                //                         console.log('update shorten url successfully');
                //                         res.render('url', {des_url:result.original_url});
                //                         //for ajax response
                //                         //res.json({status:"ok", msg:"Shorten URL updated!"})
                //                     }
                //                 });
                //             }
                //         })
                //         client.close();

                try{
                    const isExits = await client.db("account").collection("redirect").findOne({shorten_url:shortenUrl});
                    if(isExits == null){
                        return res.json({status:"err", msg:"Shorten URL is not exits!"})
                    }else{
                        isExits.clicked += 1;
                        isExits.adsTime = isExits.clicked * 5;
                        await client.db("account").collection("redirect").updateOne({shorten_url:shortenUrl}, {$set:{clicked:isExits.clicked, adsTime:isExits.adsTime}});
                        console.log(`Shorten URL : ${shortenUrl} has updated!`);
                        res.render('url', {des_url:isExits.original_url});
                    }
                }catch(err){
                    console.log(err);
                }finally{
                    await client.close();
                }

            }
}
module.exports = {User, redirectURL};