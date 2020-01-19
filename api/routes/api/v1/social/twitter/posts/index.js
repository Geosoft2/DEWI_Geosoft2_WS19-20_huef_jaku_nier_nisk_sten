// jshint esversion: 6
// jshint node: true
"use strict";

/**
* routes/api/v1/social/twitter/posts/index.js
* @see https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491
*/

const express = require('express');
const PostsRouter = express.Router();

PostsRouter.post('/', require('./twitterPosts').postMongoSearch);

PostsRouter.post('/:tweetId', require('./twitterPosts').postMongoSearchById);


module.exports = PostsRouter;
