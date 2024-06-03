const express = require('express');

const routerLists = express.Router();
const database = require("../database")


routerLists.post('/', async (req, res) => {
    let { listName } = req.body
    let userId = req.infoInApiKey.id

    if(!listName || listName == "") {
        return res.status(400).json({ error: "Incorrect list id data value" });
    }

    database.connect()

    try 
    {
        let insertedList = await database.query('INSERT INTO lists (name, userId) VALUES (?, ?)',
            [listName, userId])

        database.disConnect()
        res.json({ inserted: insertedList })
    } 
    catch (e) 
    {
        database.disConnect()
        return res.status(500).json({ error: e })
    }
});

routerLists.get('/:id', async (req, res) => {
    let listId = req.params.id;

    if(!listId || parseInt(listId) < 0) {
        return res.status(400).json({ error: "Incorrect list id data value" });
    }

    database.connect();

    try {
        let list = await database.query('SELECT * FROM lists WHERE id = ?', [listId]);
        database.disConnect();

        if (list.length == 0) 
        {
            return res.status(404).json({ error: 'List not found' })
        }
        
        res.json(list[0])
    } 
    catch (e) 
    {
        database.disConnect()
        return res.status(500).json({ error: e })
    }
})

module.exports = routerLists