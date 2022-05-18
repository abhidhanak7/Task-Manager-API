const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer =  require('multer')
const sharp = require('sharp')
const {sendWelcomeEmail, sendCancelationEmail} = require('../emails/account')
const router = new express.Router()

//API FOR CREATING THE USERS
router.post('/users', async(req,res) =>{
    const user = new User(req.body)
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token =  await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (error) {
        res.status(501).send(error)
    }
})


//FOR LOGIN THE USER WITH EMAIL AND THE PASSWORD
router.post('/users/login',async(req,res) =>{
  try {
      const user = await User.findByCredential(req.body.email, req.body.password)
      const token =  await user.generateAuthToken()
      res.send({ user,token })
  } catch (error) {
      console.log(error);
      res.status(400).send({error:"User not found"})
  }
})

//API FOR LISTING THE USER WHO IS LOGIN WITH TOKEN
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})


//FOR LOGOUT THE USER DELETING THE EXISTING TOKEN
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
       const saved =  await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

//LOGOUT USER FROM ALL THE ACCOUNTS
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

//API FOR FETCHING THE USERS BY THEIR ID 
router.get('/users/:id', async(req,res) =>{
    const _id = req.params.id
    try {
        const users = await User.findById(_id)
        if(!users){
            return res.status(404).send()
        }
        res.send(users)
    } catch (error) {
        res.status(404).send()
    }
})

//UPDATE USER BE ID 
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// DELETE USER profile
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})



   

const upload = multer({
    limits: {
        fileSize: 9000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jppeg|png)$/)) {
            return cb(new Error('Please upload an Image'))
        }
        cb(undefined, true)
    }
})



router.post('/users/me/avatar', auth, upload.single('avatar'), async(req,res) =>{
    const buffer =  await sharp(req.file.buffer).resize({height:250, width:250}).png().toBuffer()
    console.log("buffer====...", buffer);
    req.user.avatar = buffer
    const user  = await req.user.save()
    res.send({ message:"File uploaded successfully", user})
}, (error,req,res,next)=>{
    res.status(400).send({error:error.message})
})

router.delete('/users/me/avatar', auth, upload.single('avatar'), async(req,res) =>{
    try {
        req.user.avatar = undefined 
        await req.user.save()
        res.send({message:"Avatar deleted Successfully"})
    } catch (e) {
        res.status(400).send(e)
        console.log(e);
    }
    
})


router.get('/users/:id/avatar', async(req,res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error("Image not found!")
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send(e)
        console.log(e);
    }
})
module.exports = router;