const express = require('express');

const routerPresents = express.Router();
const database = require("../database")


routerPresents.post("/", async (req,res)=>{
    let name = req.body.name
    let description = req.body.description
    let url = req.body.url
    let price = req.body.price
    
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
        insertedItem = await database.query(
            'INSERT INTO presents (idUser, name, description, url, price, chosenBy) VALUES (?, ?, ?, ?, ?, ?)',
            [req.infoInApiKey.id, name, description, url, price, null])

    } catch (e){
        database.disConnect();
        return res.status(400).json({error: e})
    }

    database.disConnect();
    res.json({inserted: insertedItem})
})

routerPresents.get("/", async (req,res)=>{
    let idUser = req.infoInApiKey.id
    let email = req.infoInApiKey.email
    
    let items = []
    database.connect();

    let users = await database.query('SELECT * users WHERE email == ?',[email])

    if(users.length > 0 && idUser != undefined)
    {
        items = await database.query('SELECT presents.* , users.email'
            + 'FROM presents JOIN users ON presents.idUser = users.id WHERE presents.idUser =  ?', [idUser])
    }

    database.disConnect();
    res.send(items)
})

routerPresents.get('/:id', async (req, res) => {
    let id = req.params.id
    if ( id == undefined )
    {
        return res.status(400).json({error: "No id parameter"})
    }

    database.connect();
    const items = await database.query('SELECT presents.* , users.email'
        + 'FROM presents JOIN users ON presents.idUser = users.id WHERE presents.id =  ?', [id])

    if (items.length < 1)
    {
        database.disConnect();
        return res.status(400).json({error: "Not item with this id"})
    } else 
    {
        database.disConnect();
        return res.send(items[0])
    }
})

routerPresents.delete("/:id", async (req,res)=>{
    let id = req.params.id
    if ( id == undefined )
    {
        return res.status(400).json({error: "No id parameter"})
    }

    database.connect();

    try 
    {    
        let presents = await database.query('SELECT * FROM presents WHERE id = ? AND idUser = ?', 
            [id, req.infoInApiKey.id])

        if ( presents.length > 0 )
        {
            await database.query('DELETE FROM presents WHERE id = ?', [id])
        }
    } 
    catch (e)
    {
        res.status(400).json({error: e })
        return
    }
    
    database.disConnect();
    res.json({deleted: true})
})

routerPresents.put("/:id", async (req,res)=>{
    let id = req.params.id
    let name = req.body.name
    let description = req.body.description
    let url = req.body.url
    let price = req.body.price

    database.connect();
    let updatedItem = null;

    try 
    {
        updatedItem = await database.query('UPDATE presents SET name = ?, description = ?,' 
            + 'url = ?, initialPrice = ? WHERE id = ? AND idUser = ?', 
            [name, description, url, price, id, req.infoInApiKey.id ])

    } catch (e)
    {
        database.disConnect();
        return res.status(400).json({error: e})
    }

    database.disConnect();
    res.json({modifiyed: updatedItem})
})


module.exports = routerPresents