const express = require('express')
const jwt = require("jsonwebtoken"); 
const activeApiKeys = require("./activeApiKeys")

const routerLists = require("./routers/routerLists")
const routerUsers = require("./routers/routerUsers")
const routerFriends = require("./routers/routerFriends")
const routerPresents = require("./routers/routerPresents")

const port = 4000
const app = express()
var cors = require('cors')

app.use(cors())
app.use(express.json())

app.use(["/presents", "/friends", "/lists"] ,(req,res,next) => {
	console.log("Middleware execution")

	let apiKey = req.query.apiKey
	if ( apiKey == undefined )
  	{
		res.status(401).json({ error: "No apiKey" })
		return 
	}

	let infoInApiKey = jwt.verify(apiKey, "secret")
	if ( infoInApiKey == undefined || activeApiKeys.indexOf(apiKey) == -1)
 	{
		res.status(401).json({ error: "Invalid apiKey" })
		return 	
	}

	req.infoInApiKey = infoInApiKey
  	next()
})

app.use("/lists", routerLists)
app.use("/users", routerUsers)

app.use("/friends", routerFriends)
app.use("/presents", routerPresents)

app.listen(port, () => { console.log(`Example app listening on port ${port}`) })