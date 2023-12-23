const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const saltrounds = 10
const secretKey = 'secretKey'
const fs = require('fs')
const User = require('../models/user')


const validSignupInput =  (data)=>
{
    const {name, email, password} = data
    if (!/^[A-Za-z]+$/.test(name)) 
    {
        return {success:false, message:"Name can only contain alphabets"}
    }
    if (!validateEmail(email)) 
    {
        return {success: false, message: "Invalid email"}
    }
    if (password.length < 8) 
    {
        return { success: false, message: "Password must be at least 8 characters long" };
    }
    else 
    {
        return { success: true }
    }
}
const validateEmail = (email) => 
{
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


exports.signUp = async(req, res)=>
{
    console.log(req.body)
    const isValid = validSignupInput(req.body)

    if (!isValid.success) 
    {
        res.json({ success: false, message: isValid.message })
        return
    }

    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    
    if(!name || !email || !password)
    {
        return res.json({success:false, message:"You have inserted null values"})
    }

    const user = await User.findOne({email})
    if(user)
    {
        return res.json({success:false, message:"User with this email already exists"})
    }

    const hashedPassword = await bcrypt.hash(password, saltrounds)
    try
    {
        const newUser = await User.create({name, email, password:hashedPassword})
        return res.json({success:true, message:"You have successfully signed up"})
    }
    catch(error)
    {
        console.error(error)
        return res.json({success:false, message:"An error occured during signup"})
    }
}



exports.login = async (req,res) =>
{
    const email = req.body.email
    const password = req.body.password

    if(!email || !password)
    {
        res.json({success:false, message:"Please enter email and password"})
        return
    }

    const user = await User.findOne({email})
    if(!user)
    {
        return res.json({success: false, message:"No account found having this email"})
    }

    const isEqual = await bcrypt.compare(password, user.password)
    if(!isEqual)
    {
        return res.json({success:false, message:"Wrong password"})
    }

    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
    return res.json({ success: true, userId: user._id, name: user.name,  token: token});
}



exports.editUserProfile = async (req, res)=>
{
    const userId = req.userId
    const name = req.body.name
    const password = req.body.password
    const profilePicture = req.body.profilePicture
    
    try
    {
        const user = await User.findById(userId)
        if(!user)
        {
            return res.status(404).json({success:false, message:"User not found"})
        }
        if(name)
        {
            user.name = name
        }
        if(password)
        {
            const hashedPassword = await bcrypt.hash(password, saltrounds);
            user.password = hashedPassword
        }
        if(profilePicture)
        {
            user.profilePicture = profilePicture
        }

        await user.save()
        return res.status(200).json({success:true, message:"Profile edited successfully"})
    }
    catch(error)
    {
        console.error(error)
        return res.status(500).json({success:false, message:"Error occured while editing the profile"})
    }
}



exports.viewAllProfile = async(req, res)=>
{
    const userId = req.userId

    try
    {
        const user = await User.findById(userId)
        if(!user)
        {
            return res.status(404).json({success:false, message:"User not found"})
        }
        const users = await User.find({}, 'name profilePicture');
        if(!users)
        {
            return res.status(404).json({success:false, message:"No profiles found"})
        }

        return res.status(200).json({success:true, profiles:users})
    }
    catch(error)
    {
        console.error(error)
        return res.status(500).json({success:false, message:"Error occured while viewinf all profiles"})
    }
}



exports.searchByName = async (req, res) => 
{
  try 
  {
    const { name } = req.query

    if (!name) 
    {
      return res.status(400).json({ success: false, message: "Please provide a name to search for." })
    }

    const users = await User.find({ name: { $regex: new RegExp(name, 'i') } }, 'name profilePicture')
    if (!users || users.length === 0) 
    {
      return res.status(404).json({ success: false, message: "No profiles found with that name." })
    }

    return res.status(200).json({ success: true, profiles: users })
  } 
  catch (error) 
  {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error occurred while searching for profiles by name." })
  }

}

exports.sendFriendRequest = async(req, res)=>
{
    const senderId = req.userId
    const receiverId = req.params.receiverId

    try
    {
        const sender = await User.findById(senderId)
        if(!sender)
        {
            return res.status(404).json({success:false, message:"Sender not found"})
        }
        const receiver = await User.findById(receiverId)
        if(!receiver)
        {
            return res.status(404).json({success:false, message:"Receiver not found"})
        }

        if (sender.friendRequests.includes(receiverId) || receiver.friendRequests.includes(senderId)) 
        {
            return res.status(400).json({ success: false, message: "Friend request already sent or received." });
        }
        sender.friendRequests.push(receiverId);
        receiver.friendRequests.push(senderId);

        await sender.save();
        await receiver.save();

        return res.status(200).json({ success: true, message: "Friend request sent successfully." });
    }
    catch (error) 
    {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error occurred while sending the friend request." });
    }
}

exports.acceptFriendRequest = async (req, res)=>
{
    const loggedInUserId = req.userId
    const userIdToAccept = req.params.userIdToAccept

    try
    {
        const loggedInUser = await User.findById(loggedInUserId)
        if(!loggedInUser)
        {
            return res.json({success:false, message:"Logged in user not found"})
        }

        const userToAccept = await User.findById(userIdToAccept)
        if(!userToAccept)
        {
            return res.json({success:false, message:"User to accept not found"})
        }

        loggedInUser.friendRequests = loggedInUser.friendRequests.filter((friendsId)=>friendsId.toString() !== userIdToAccept)
        loggedInUser.friends.push(userIdToAccept)

        userToAccept.friendRequests = userToAccept.friendRequests.filter((friendsId)=>friendsId.toString() !== loggedInUser)
        userToAccept.friends.push(loggedInUserId)

        await loggedInUser.save()
        await userToAccept.save()

        return res.json({success:true, message:"Friend request accepted"})
    }
    catch(error)
    {
        console.error(error)
        return res.json({success:false, message:"An error occured while acccepting the request"})
    }
}



exports.updatepfp = async(req, res)=>
{
    try 
    {
        const userId = req.userId;
        const { file } = req;
    
        const user = await User.findById(userId);
    
        if (!user) 
        {
          return res.status(404).json({ success: false, message: "User not found." });
        }
    
        if (!file.mimetype.startsWith("image/")) 
        {
            return res.status(400).json({ success: false, message: "Only image files are allowed as profile pictures." });
        }
      
        if (user.profilePicture && user.profilePicture.fileUrl) 
        {
          const oldFilePath = user.profilePicture.fileUrl.replace("http://localhost:8080/", "");
        
          fs.unlink(oldFilePath, (err) => 
          {
            if (err) 
            {
              console.error("Error deleting old profile picture:", err);
            } 
            else 
            {
              console.log("Old file deleted successfully.");
            }
          });
        }
    
        const fileUrl = `http://localhost:8080/${req.file.path.replace(/\\/g, "/")}`;
        user.profilePicture =  fileUrl 
    
        await user.save();
        return res.status(200).json({ success: true, message: "Profile picture updated successfully." });
      } 
      catch (error) 
      {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error occurred while updating the profile picture." });
      }
}

