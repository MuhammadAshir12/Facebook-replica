const express = require('express')
const app = express()
const path = require ('path')
const mongoose = require('mongoose')
const userRoute = require ('./routes/user')
const postRoute = require('./routes/post')

app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.get('/', (req, res)=>
{
    res.json({success:true})
})

app.use('/user', userRoute)
app.use('/post', postRoute)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))) // purpose of this is k ap ko image ya baki files web pay show houn

const port = 8080
const url = 'mongodb://127.0.0.1:27017/newdb'
mongoose.connect(url, { useUnifiedTopology: true, useNewUrlParser: true })

    .then(() => 
    {
        console.log('Connection detected')
        console.log('Connected to database')
        const server = app.listen(port, () => console.log('Server Started', port))
    })
    .catch(err => 
        {
        console.log('Failed to start server')
        console.log(err)
    })
