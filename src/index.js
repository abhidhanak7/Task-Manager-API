const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/userRouter')
const taskRouter = require('./routers/taskRouter')

//storing all the thing of express to app
const app = express()
const port = process.env.PORT

//ALLOWING EXPREES OUR APP TO USE things like json files
app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

//listing to the Port
app.listen(port, () => {
    console.log("Server is up and running on the Port: " + port );
})

