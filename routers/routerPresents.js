const express = require('express');

const routerPresents = express.Router();
const database = require("../database")


routerPresents.post("/", async (req,res)=>{
    let name = req.body.name
    let description = req.body.description
    let url = req.body.url
    let price = req.body.price
    let listId = req.body.listId

    if(!listId || parseInt(listId) < 0) {
        return res.status(400).json({ error: "Incorrect list id data value" });
    }    
    if(name == undefined || description == undefined || url == undefined || price == undefined){
        return res.status(400).json({error: "Some properties are undefined"})
    }
    if(name === null || name === "" || name?.length < 3){
        return res.status(400).json({error: "Name is not valid"})
    }
    if(url === null || url === "" || url?.length < 3){
        return res.status(400).json({error: "Url is not valid"})
    }
    if (isNaN(price)){
        return res.status(400).json({error: "Price has a not a valid format"})
    }
    if (parseFloat(price) <= 0 ){
        return res.status(400).json({error: "Invalid price can not be negative"})
    }

    database.connect();
    let insertedItem = null;

    try {
        let list = await database.query("select * from lists where id = ?", [listId])

        if(list.length == 0)
        {
            await database.query("insert into lists (name, userId) values (?, ?)", 
                ["list" + listId, req.infoInApiKey.id])
        }

        insertedItem = await database.query(
            'INSERT INTO presents (userId, name, description, url, price, choosenBy, listId) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?)', [req.infoInApiKey.id, name, description, url, price, "", listId])

    } catch (e){
        database.disConnect();
        return res.status(400).json({error: e})
    }

    database.disConnect();
    res.json({inserted: insertedItem})
})


routerPresents.get('/:id', async (req, res) => {
    let id = req.params.id
   
    if ( id == undefined ) {
        return res.status(400).json({error: "No id parameter"})
    }

    database.connect();
    const items = await database.query('SELECT presents.* , users.email FROM presents JOIN users ON '
        + 'presents.userId = users.id WHERE presents.id = ?', [id])

    if (items.length < 1)
    {
        database.disConnect();
        return res.status(400).json({error: "Not item was found"})
    } else 
    {
        database.disConnect();
        return res.send(items[0])
    }
})

routerPresents.delete("/:id", async (req,res)=>{
    let id = req.params.id

    if ( id == undefined ) {
        return res.status(400).json({error: "No id parameter"})
    }

    database.connect();

    try 
    {    
        await database.query('DELETE FROM presents WHERE id = ?', [id])
    } 
    catch (e)
    {
        res.status(400).json({error: e })
        return
    }
    
    database.disConnect();
    res.json({deleted: true})
})

routerPresents.put("/:id", async (req, res) => {
    let id = req.params.id
    let email = req.infoInApiKey.email
    let possibleFriend = req.query.emailFriend

    database.connect()

    try {        
        let giftResults = await database.query("SELECT presents.*, users.email as ownerEmail "
            + "FROM presents JOIN users ON presents.userId = users.id WHERE presents.id = ?", [id])

        if (giftResults.length === 0) 
        {
            return res.status(400).json({ error: "Present not found" });
        }

        let gift = giftResults[0]
        let ownerEmail = gift.ownerEmail
        let choosenBy = gift.choosenBy

        if (email == ownerEmail && !(JSON.stringify(req.body) === JSON.stringify({}))) 
        {
            let { name, description, url, price } = req.body
            let updatedItem = await database.query("UPDATE presents SET name = ?, description = ?, "
                + "url = ?, price = ? WHERE id = ?", [name, description, url, price, id])

            database.disConnect();
            return res.json({ modified: updatedItem })
        } 
        else if (possibleFriend != undefined)
        {
            let friends = await database.query("SELECT * FROM friends WHERE emailUser = ? " 
                + "AND emailFriend = ?", [email, possibleFriend])

            if (friends.length == 0) 
            {
                return res.status(400).json({ error: "You are not friends with the owner of this present" })
            }

            if (choosenBy) 
            {
                return res.status(400).json({ error: "This present is already choosen by another user" })
            }

            let updatedItem = await database.query('UPDATE presents SET choosenBy = ? WHERE id = ?', 
                    [email, id])

            database.disConnect();
            return res.json({ modified: updatedItem });
        }
    } catch (e) {
        database.disConnect()
        return res.status(500).json({ error: e.message })
    }
})


routerPresents.get("/", async (req, res) => {
    let userEmail = req.query.userEmail
    let email = req.infoInApiKey.email
    let myPresents = req.query.myPresents

    if (!email) return res.status(400).json({ error: 'ApiKey email is required' })

    if(myPresents) 
    {
        database.connect()
        let result = await database.query('SELECT * FROM presents WHERE choosenBy = ?', [email])
        database.disConnect()
        res.send(result)
        return
    }

    if (!userEmail) 
    {
        let idUser = req.infoInApiKey.id
        
        let items = []
        database.connect()
    
        let users = await database.query('SELECT * FROM users WHERE email = ?',[email])
    
        if(users.length > 0 && idUser != undefined)
        {
            items = await database.query('SELECT presents.* , users.email '
                + 'FROM presents JOIN users ON presents.userId = users.id WHERE presents.userId =  ?', [idUser])
        }
    
        database.disConnect()
        res.send(items)
    }
    else
    {
        database.connect()

        try {
            let userQuery = await database.query('SELECT * FROM users WHERE email = ?', [email])

            if (userQuery.length < 1) 
            {
                return res.status(400).json({ error: 'Apikey user not found' })
            }

            let friendQuery = await database.query('SELECT * FROM users WHERE email = ?', [userEmail])
            if (friendQuery.length < 1) 
            {
                return res.status(400).json({ error: 'Friend user not found' })
            }

            let areFriends = await database.query(
                'SELECT * FROM friends WHERE emailUser = ? AND emailFriend = ?',
                [email, userEmail]
            )

            if (areFriends.length < 1) {
                return res.status(400).json({ error: 'Users are not friends' })
            }

            let presents = []
            let friendUserId = friendQuery[0].id

            presents = await database.query('SELECT * FROM presents WHERE choosenBy = "" '
                + 'AND userId = ?',  [friendUserId])

            res.send(presents)
        } 
        catch (error) 
        {
            return res.status(500).json({ error: 'Server internal error' })
        } 
        finally 
        {
            database.disConnect()
        }
    }
})

module.exports = routerPresents