const jwt = require('jsonwebtoken')
const secretKey = 'secretKey'
const User = require('../models/user')


exports.isAuth = async (req, res, next) => 
{
    try 
    {
        const authHeader = req.headers.authorization
        if (!authHeader) 
        {
            return res.status(401).json({ success: false, message: "Not authenticated." })
        }

        const token = authHeader.split(' ')[1]
        let decodedToken
        try 
        {
            decodedToken = jwt.verify(token, secretKey)
        } 
        catch (err) 
        {
            return res.status(403).json({ success: false, message: "Invalid or expired token." })
        }

        if (!decodedToken) 
        {
            return res.status(401).json({ success: false, message: "Not authenticated." })
        }

        req.userId = decodedToken.userId

        const user = await User.findById(req.userId)
        if (!user) 
        {
            return res.status(401).json({ success: false, message: "User not found. Invalid token." })
        }

        next()
    } 
    catch (err) 
    {
        next(err)
    }   
}

