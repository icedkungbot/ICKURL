const {
    MongoClient
} = require("mongodb");
require('dotenv').config();
// Replace the uri string with your connection string.
const uri = process.env.MONGO_URI || "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const bcrypt = require('bcrypt');
const saltRound = parseInt(process.env.SALTROUND) || 10;

const User = {
    create:async (username, password, req, res) => {
        //save username and password to database
        try{
            await client.connect();
            const isExits = await client.db("account").collection("user").findOne({username:username});
            if(isExits != null){
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
            try{
                await client.connect();
                const isExits = await client.db("account").collection("redirect").findOne({shorten_url:shortenUrl});
                if(isExits != null){
                    return res.json({status:"err", msg:"Shorten URL is already exits!"})
                }else{
                    const owner = req.session.user;
                    const OwnURL = await client.db("account").collection("redirect").find({owner:owner}).toArray();
                    const newShortenUrl = {
                        id: OwnURL.length + 1 + owner,
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
                try{
                    await client.connect();
                    const isExits = await client.db("account").collection("redirect").findOne({shorten_url:shortenUrl});
                    if(isExits == null){
                        return res.json({status:"err", msg:"Shorten URL is not exits!"})
                    }else{
                        isExits.clicked += 1;
                        isExits.adsTime = isExits.clicked * 5;
                        await client.db("account").collection("redirect").updateOne({shorten_url:shortenUrl}, {$set:{clicked:isExits.clicked, adsTime:isExits.adsTime}});
                        console.log(`Shorten URL : ${shortenUrl} has updated!`);
                        return isExits.original_url;
                    }
                }catch(err){
                    console.log(err);
                }finally{
                    await client.close();
                }

            }
}
module.exports = {User, redirectURL};
