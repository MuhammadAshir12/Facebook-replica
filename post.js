const express = require("express")
const router = express.Router()
const User = require('../models/user')
const Post = require('../models/post')


exports.createPost = async(req,res)=>
{
   const userId = req.userId
   const description = req.body.description

   if (!req.files || !req.files['file'] || req.files['file'].length === 0) 
   {
       return res.status(400).json({ success: false, message: "No files uploaded" });
   }

  try 
  {
    const user = await User.findById(userId);
    if (!user) 
    {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userFriends = user.friends;
    const postFiles = [];

    // Process each uploaded file
    for (const file of req.files['file']) 
    {
      const fileType = file.mimetype.split('/')[0];
      const fileUrl = `http://localhost:8080/${file.path.replace(/\\/g, "/")}`;

      postFiles.push
      ({
        fileType,
        fileUrl,
      });
    }

    const post = new Post
    ({
      userId,
      description,
      post: postFiles, // Save all uploaded files in the 'post' array
      visibleToFriends: true,
    });

    await post.save();
    res.status(200).json({ message: "Post created successfully", post });
  } 
  catch (error) 
  {
    console.error(error);
    return res.status(500).json({ success: false, message: "An error occurred while creating a post" });
  }
};


exports.viewAllPost = async(req, res)=>
{
    const userId = req.userId

    try
    {
        const user = await User.findById(userId)
        if(!user)
        {
            return res.status(404).json({success:false, message:"User not found"})
        }
        const userFriends = user.friends
        const posts = await Post.find({  $or: [ { userId: userId }, { userId: { $in: userFriends } }, ],})
        .sort({ createdAt: -1 }) 
      
        res.status(200).json({ success: true, posts });
    }
    catch(error)
    {
        console.error(error)
        return res.status(500).json({success:false, message:"An error occured while viewing all posts"})
    }
}


exports.likePost = async(req, res)=>
{
    const userId = req.userId
    const postId = req.params.postId
    
    try
    {
        const user = await User.findById(userId)
        if(!user)
        {
            return res.status(404).json({success:false, message:"User not found"})
        }
        const post = await Post.findById(postId)
        if(!post)
        {
            return rs.status(404).json({success:false, message:"Post not found"})
        }

        const isFriend = user.friends.includes(post.userId.toString())
        if(!isFriend)
        {
            return res.status(403).json({success:false, message:"You can only like post of friends"})
        }

        if (post.likes.includes(req.userId)) 
        {
            post.likes.pull(userId); 
            await post.save();
            res.status(200).json({ success: true, message: "Post unliked successfully" });
        } 
        else 
        {
            post.likes.push(userId);
            await post.save();
            res.status(200).json({ success: true, message: "Post liked successfully" });
        }
    }
    catch(error)
    {
        console.error(error)
        return res.status(500).json({success:false, message:"An error occured posting a like"})
    }
}


exports.commentPost = async(req, res)=>
{
    const postId = req.params.postId
    const userId = req.userId
    const commentText = req.body.commentText

    try
    {
        const user = await User.findById(userId)
        if(!user)
        {
            return res.status(404).json({success:false, message:"User not found"})
        }

        const post = await Post.findById(postId)
        if(!post)
        {
            return res.status(404).json({success:false, message:"Post not found"})
        }

        const newComment =
        {
            userId: userId,
            text: commentText
        }

        post.comments.push(newComment);
        await post.save()
        return res.status(500).json({success:true, mesage:"Comment posted successfully"})
    }
    catch(error)
    {
        console.error(error)
        return res.status(500).json({success:false, message:"An error occured while posting a comment"})
    }
}



exports.deleteComment = async(req, res)=>
{
    const userId = req.userId
    const postId = req.params.postId
    const commentId = req.params.commentId

    try
    {
        const user = await User.findById(userId)
        if(!user)
        {
            return res.status(404).json({success:false, message:"User not found"})
        }
        const post = await Post.findById(postId)
        if(!post)
        {
            return res.status(404).json({success:false, message:"Post not found"})
        }
        const comment = post.comments.id(commentId);
        if(!comment)
        {
            return res.status(404).json({success:false, message:"Comment not found"})
        }

        if (comment.userId.toString() !== userId) 
        {
            return res.status(403).json({ success: false, message: "You can only delete your own comments" });
        }

        const isFriend = user.friends.includes(post.userId.toString());
        if (!isFriend) 
        {
          return res.status(403).json({ success: false, message: "You can only delete comments on your friends' posts" });
        }
    
        const commentIndex = post.comments.findIndex((c) => c._id.equals(commentId));
        if (commentIndex !== -1) 
        {
          post.comments.splice(commentIndex, 1);
        }        
        
        await post.save();
        res.status(200).json({ success: true, message: "Comment deleted successfully" });
    }
    catch(error)
    {
        console.error(error)
        return res.status(500).json({success:false, message:"An error occured while deleting the comment"})
    }
}



exports.sharePost = async(req, res)=>
{
    const userId = req.userId
    const postId = req.params.postId

    try
    {
        const user = await User.findById(userId)
        if(!user)
        {
            return res.status(404).json({success:false, message:"User not found"})
        }

        const post = await Post.findById(postId)
        if(!post)
        {
            return res.status(404).json({success:false, message:"Post not found"})
        }
        
        const isFriend = user.friends.includes(post.userId.toString());
        if (!isFriend) 
        {
          return res.status(403).json({ success: false, message: "You can only share posts of your friends" });
        }

        const sharedPost = new Post
        ({
            userId,
            post: post.post
        });
      
          await sharedPost.save();
          post.shares.push(sharedPost._id);
          await post.save();

          res.status(200).json({ success: true, message: "Post shared successfully", sharedPost });
    }
    catch(error)
    {
        console.error(error)
        return res.status(500).json({success:false, message:"An error occured while sharing the post"})
    }
}


exports.deletePost = async(req, res)=>
{
    const userId = req.userId
    const postId = req.params.postId

    try
    {
        const user =await User.findById(userId)
        if(!user)
        {
            return res.status(404).json({success:false, message:"User not found"})
        }

        const post = await Post.findById(postId)
        if(!post)
        {
            return res.status(404).json({success:false, message:"Post not found"})
        }
        if (post.userId.toString() !== userId) 
        {
            return res.status(403).json({ success: false, message: "You can only delete your own posts" });
        }

        await Post.findByIdAndDelete(postId);
        res.status(200).json({ success: true, message: "Post deleted successfully" });
    }
    catch(error)
    {
        console.error(error)
        return res.status(500).json({success:false, message:"An error occured while deleting a post"})
    }
}



exports.editPost = async (req, res) => 
{
    const postId = req.params.postId
    const { description, deletedMedia, newMedia } = req.body
    const intArray = deletedMedia.split(',').map(Number)

    try 
    {
      const post = await Post.findById(postId)
      if (!post) 
      {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
  
      // Update the post description if provided
      if (description !== undefined) 
      {
        post.description = description
      }
  
      const postLen=post.post.length
      // Delete specific media items
      if (Array.isArray(intArray)) 
      {
        // Loop through the positions to delete
        for (let position of intArray) 
        {
          // Check if the position is valid
          if (position >= 0 && position < postLen) 
          {
            if(position>=post.post.length)
            {
                position=position-(position-post.post.length)-1
                post.post.splice(position, 1);// Remove the media item at the specified position
            } // Remove the media item at the specified position
          }
        }
      }
        // Add new media items if provided
      if (Array.isArray(intArray)) 
      {
        for (const file of req.files['file']) 
        {
        const fileType = file.mimetype.split('/')[0]
        const fileUrl = `http://localhost:8080/${file.path.replace(/\\/g, "/")}`

        post.post.push
        ({
            fileType,
            fileUrl,
        });
        }
      }
  
      await post.save()
      res.status(200).json({ success: true, message: "Post edited successfully", post })
    } 
    catch (error) 
    {
      console.error(error)
      return res.status(500).json({ success: false, message: "An error occurred while editing the post" });
    }
  }