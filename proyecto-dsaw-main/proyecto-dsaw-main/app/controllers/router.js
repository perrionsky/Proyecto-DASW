"use strict";

const express = require('express');
const router = express.Router();
const productRouter = require('./../routes/products');
const adminProductRouter = require('./../routes/admin_products');
const firebaseHelper = require('./helpers/firebase_helper');
const userHelpers = require('./helpers/user_helpers');
const multer = require('multer');
const path = require('path');
const imgbbUploader = require("imgbb-uploader");
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, 'uploads')); 
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});
  
const upload = multer({ storage: storage });


router.use('/admin/products/', validateAdmin, adminProductRouter);
router.use('/products/', productRouter);

router.get(['/', '/home'], (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'index2.html'));
});



router.get(['/posts-d/:username/:postId'], (req, res) => {
    res.sendFile(path.join(__dirname, '../views/posts', 'post_detail.html'));
});



router.get(['/about'], (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'about.html'));
});

router.get('/shopping_cart', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'cart.html'));
});


router.get('/users/login', async (req, res) => {
    const userToken = req.cookies.userToken;
    const username = req.cookies.username;
    console.log("userTOKEN IN ROUTERS " + userToken);
    console.log("USERNAME IN ROUTERS " + username);


    // Validate user token and username
    if (userToken && username) {
        let ret = await firebaseHelper.validateToken(username, userToken);
        console.log(ret);
        if (ret) {
            // If valid, redirect to my-profile
            res.redirect(`/users-d/${username}/`);
        }
        else {
            res.sendFile(path.join(__dirname, '../views', 'login.html'));
        }
        
    } else {
        // If invalid, serve the login page
        res.sendFile(path.join(__dirname, '../views', 'login.html'));
    }
});

router.get('/users/logout', async (req, res) => {
    const userToken = req.cookies.userToken;
    const username = req.cookies.username;
    console.log(userToken);
    console.log(username);


    // Validate user token and username
    if (userToken && username) {
        let ret = await firebaseHelper.validateToken(username, userToken);
        console.log(ret);
        if (ret) {
            res.clearCookie('userToken', { path: '/' });
            res.clearCookie('username', { path: '/' });
            // If valid, redirect to my-profile
            res.redirect(`/users/login/`);
        }
        else {
            res.redirect(`/users-d/${username}/`);
        }
        
    } else {
        // If invalid, serve the login page
        res.redirect(`/`);
    }
});



router.get('/users-d/:username', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'user_detail.html'));
});

router.get('/users-d/add-post/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'add_post.html'));
});


router.post('/users/login', async (req, res) => {
    const userId = req.body.username;
    const password = req.body.password; // Ensure password is securely handled and stored
    let resDB = await firebaseHelper.setUserLoginData(userId, password);

    console.log(resDB);
    if (resDB) {
        // validate password
        let isValidPassword = await firebaseHelper.validatePassword(userId, password);
        if (!isValidPassword) {
            // redirect to index()
            return res.redirect("/users/login/?error=invalid");
        }
    }

    // this model is defined under controllers/models, and is the 
    // base for the API responses 

    const userTOKEN = userHelpers.generateUUID(); // random access token for temp sess
    resDB = firebaseHelper.setUserToken(userId, userTOKEN);

    res.cookie('username', userId, {
        // httpOnly: true, // Secure against XSS by preventing client-side JavaScript from accessing it
        secure: true,  // Ensure the cookie is only sent over HTTPS connections
        sameSite: 'Strict' // Prevent cross-site request forgery (CSRF)
    });

    res.cookie('userToken', userTOKEN, {
        // httpOnly: true,
        secure: true,
        sameSite: 'Strict'
    });
    // push that token into the database
    // res.status(200).send('{"state" : "success", "message" : "' + userTOKEN + '" }');

    // res.set('X-user-token', userTOKEN);

    // Send the HTML file
    return res.redirect(`/users-d/${userId}?userToken=${userTOKEN}`);
    // res.sendFile(path.join(__dirname, '../views', 'my-profile.html'));
});




router.post('/users/is-logged-in-or-register', async (req, res) => {
    const userId = req.body.username;
    const userTOKEN = req.body.userTOKEN;  // Extracts userTOKEN from request

    try {
        // First, check if the user exists
        const userExists = await firebaseHelper.checkUserExists(userId);

        if (!userExists) {
            // If the user does not exist, redirect to a registration form
            return res.status(302).json({
                state: "redirect",
                message: "User not found, please register",
                redirectUrl: "/users/register" //redirect to registry
            });
        }

        // If user exists, then validate the token
        console.log(userId);
        console.log(userTOKEN)
        
        let tokenIsValid = await firebaseHelper.validateToken(userId, userTOKEN);
        if (!tokenIsValid) {
            return res.status(400).json({ state: "error", message: "Token does not match" });
        }

        return res.status(200).json({ state: "success", message: "Token matches" });
    } catch (error) {
        // Handle potential errors in validation or user existence check
        console.error("Error during login or registration process:", error);
        return res.status(500).json({ state: "error", message: "Server error" });
    }
});

// routes for database update
router.get('/write_database', (req, res) => {
    firebaseHelper.writeFirebase();
    res.status(200).send("Todo excelente");
});


// routes for user
// IMPORTANT: every route requires the 'userTOKEN' field to validate data
// that field should be stores in localStorage or sessionStorage inside the browser
// and when doing requests, use that field inside the api requests and done!



// routes for post detail
router.get('/my-posts/:username', (req, res) => {
    const username = req.params.username;
    const token = req.headers['authorization']; // Commonly tokens are passed in the 'Authorization' header

    // Check if the token is present
    if (!token) {
        return res.status(401).send("Access denied. No token provided.");
    }

    // Proceed with your Firebase function if token validation passes
    firebaseHelper.getUserPosts(username, token)
        .then(posts => {
            res.status(200).json(posts);
        })
        .catch(error => {
            console.error("Error fetching user posts", error);
            res.status(500).send("Error processing your request");
        });
});



// CRUD POSTS
router.get('/users/:username/:post_id', async (req, res) => {
    const username = req.params.username;
    const post_id = req.params.post_id;
    
    // now check if the post exists
    let post_info = await firebaseHelper.getPostById(username, post_id);
    if (post_info === undefined) {
        // post does not exist
        // we can send them to a 404 page
        return res.status(404).send('{"state" : "error", "message" : "Post not found" }');
    }

    console.log(post_info);

    let postDetailOnString = JSON.stringify(post_info);
    return res.status(200).send({ state: "success", message: post_info });

});


router.post('/users/add-post/', upload.single('image'), async (req, res) => {

    const { title, content, summary, section } = req.body;
    console.log(req.file);
    const img_url = req.file ? path.join(__dirname, 'uploads', req.file.filename) : undefined;
    console.log("IMAGE URL " + img_url);
    
    var image_full_url = ""

    const imgbbResponse = await imgbbUploader("46c645a9d2728be69b21e840cec640cc", img_url);
    image_full_url = imgbbResponse.url;  
    console.log("Uploaded Image URL: " + image_full_url);

    fs.unlink(img_url, (err) => {
        if (err) {
            console.error("Failed to delete local image:", err);
        }
        console.log("Successfully deleted local image");
    });

    const username = req.cookies.username;
    const userToken = req.cookies.userToken;

    console.log("USER TOKEN " + userToken);

    let ret = await firebaseHelper.validateToken(username, userToken);
    if (!ret) {
        res.status(400).send('{"state" : "error", "message" : "Not valid token" ');
    }

    const result = await firebaseHelper.createPost(username, title, content, userToken, image_full_url, section, summary);

    if (result.success) {
        // Redirect to the user's dashboard or another page after successfully adding the post
        // res.redirect(`/users-d/${username}`);
        res.status(200).send('{"state" : "success", "message" : "Post added"} ');
    } else {
        // Handle any errors from the post creation
        // res.redirect('/users/add-post/?error=failed');
        res.status(400).send('{"state" : "error", "message" : "Not valid" }');
    }

});

router.post('/users-d/:username/post/', async (req, res) => {
    const post_id = req.params.post_id;

    const userToken = req.cookies.userToken;
    const usernameCookie = req.cookies.username;

    // Check if the token is present
    if (!token) {
        return res.status(401).send("Access denied. No token provided.");
    }

    // now check if the post exists
    let post_info = await firebaseHelper.getPostById(username, post_id);
    if (post_info === undefined) {
        // post does not exist
        // we can send them to a 404 page
        // ADRIAN, aqui si retorna 404, mandalo a un not found
        return res.status(404).send('{"state" : "error", "message" : "Post not found" ');
    }

    let postDetailOnString = JSON.stringify(post_info);
    return res.status(200).send(`{"state" : "success", "message" : "${postDetailOnString}"`);

    // ADRIAN, aqui se va a retornar toda la info del post, por lo tanto es importante que
    // cuando el usuario habra el post detail siempre se verifique que
    // si el es el owner del post, entonces pueda modificar la info en el html, de lo contrario
    // le aparecera en readonly, eso lo haces con el userTOKEN

    // para validar si es el owner, simplemente manda a llamar al endpoint de /is-logged-in/ 
    // donde le pasas por parametro el username del post que se acaba de abrir, mas el userTOKEN
    // que tienes guardado en el session storage y si sale bien, es por que es su post y puede editarlo!

});


router.post('/users/:username/:post_id/upvote', async (req, res) => {
    const post_id = req.params.post_id;

    const userToken = req.cookies.userToken;
    const usernameCookie = req.cookies.username;

    // Check if the token is present
    if (!token) {
        return res.status(401).send("Access denied. No token provided.");
    }

    // now check if the post exists
    let post_info = await firebaseHelper.getPostById(username, post_id);
    if (post_info === undefined) {
        // post does not exist
        // we can send them to a 404 page
        // ADRIAN, aqui si retorna 404, mandalo a un not found
        return res.status(404).send('{"state" : "error", "message" : "Post not found" ');
    }

    let postDetailOnString = JSON.stringify(post_info);
    return res.status(200).send(`{"state" : "success", "message" : "${postDetailOnString}"`);
});


router.post('/users/:username/:post_id/downvote', async (req, res) => {
    const post_id = req.params.post_id;

    const userToken = req.cookies.userToken;
    const usernameCookie = req.cookies.username;

    // Check if the token is present
    if (!token) {
        return res.status(401).send("Access denied. No token provided.");
    }

    // now check if the post exists
    let post_info = await firebaseHelper.getPostById(username, post_id);
    if (post_info === undefined) {
        // post does not exist
        // we can send them to a 404 page
        // ADRIAN, aqui si retorna 404, mandalo a un not found
        return res.status(404).send('{"state" : "error", "message" : "Post not found" ');
    }

    let postDetailOnString = JSON.stringify(post_info);
    return res.status(200).send(`{"state" : "success", "message" : "${postDetailOnString}"`);
});


router.put('/users/:username/:post_id/', async (req, res) => {
    const { title, content, summary, section } = req.body;
    
    const post_id = req.params.post_id;
    const username = req.params.username;
    
    const usernameCookies = req.cookies.username;
    const userTokenCookies = req.cookies.userToken;
    
    if (!usernameCookies || username !== usernameCookies) {
        res.status(400).send({"state" : "error", "message" : "Not valid token 1" });
    }


    let ret = await firebaseHelper.validateToken(usernameCookies, userTokenCookies);
    if (!ret) {
        res.status(400).send({"state" : "error", "message" : "Not valid token" });
    }

    const result = await firebaseHelper.editPost(post_id, usernameCookies, title, content, userTokenCookies, "", section, summary);

    if (result.success) {
        // Redirect to the user's dashboard or another page after successfully adding the post
        // res.redirect(`/users-d/${username}`);
        res.status(200).send({"state" : "success", "message" : "Post added" });
    } else {
        // Handle any errors from the post creation
        // res.redirect('/users/add-post/?error=failed');
        res.status(400).send({"state" : "error", "message" : "Not valid" });
    }

});


router.delete('/users/:username/:post_id/', async (req, res) => {
    const username = req.params.username;
    const post_id = req.params.post_id;

    const userTokenCookie = req.cookies.userToken;
    const usernameCookie = req.cookies.username;

    console.log("USERNME COOKIE " + usernameCookie);
    console.log("USERNME " + usernameCookie);

    if (usernameCookie !== username) {
        return res.status(400).send('{"state" : "error", "message" : "Cannot delete post" }');
    }

    let ret = await firebaseHelper.validateToken(usernameCookie, userTokenCookie);
    if (!ret) {
        return res.status(400).send('{"state" : "error", "message" : "Cannot delete post" }');
    }

    // delete post

    // now check if the post exists
    let resDB = await firebaseHelper.deletePostById(username, post_id, userTokenCookie);
    if (resDB === false) {
        // cannot delete post, probably beacuse of ownership
        return res.status(400).send('{"state" : "error", "message" : "Could not delete post" }');
    }

    return res.status(200).send(`{"state" : "success", "message" : "Post deleted"}`);

});



// CRUD POSTS
// router.get('/posts/', async (req, res) => {

//     // now check if the post exists
//     let post_info = await firebaseHelper.getPostById(username, post_id);
//     if (post_info === undefined) {
//         // post does not exist
//         // we can send them to a 404 page
//         // ADRIAN, aqui si retorna 404, mandalo a un not found
//         return res.status(404).send('{"state" : "error", "message" : "Post not found" ');
//     }

//     let postDetailOnString = JSON.stringify(post_info);
//     return res.status(200).send(`{"state" : "success", "message" : "${postDetailOnString}"`);

//     // ADRIAN, aqui se va a retornar toda la info del post, por lo tanto es importante que
//     // cuando el usuario habra el post detail siempre se verifique que
//     // si el es el owner del post, entonces pueda modificar la info en el html, de lo contrario
//     // le aparecera en readonly, eso lo haces con el userTOKEN

//     // para validar si es el owner, simplemente manda a llamar al endpoint de /is-logged-in/ 
//     // donde le pasas por parametro el username del post que se acaba de abrir, mas el userTOKEN
//     // que tienes guardado en el session storage y si sale bien, es por que es su post y puede editarlo!

// });

router.get('/api/posts', async (req, res) => {
    try {
        // Obtener todos los posts desde la base de datos
        const allPosts = await firebaseHelper.getAllPosts();

        // Verifica si hay posts
        if (allPosts.length === 0) {
            return res.status(404).json({ state: 'error', message: 'No posts found' });
        }

        // Responder con todos los posts
        return res.status(200).json({ state: 'success', message: allPosts });
    } catch (error) {
        // Manejo de errores
        console.error('Error fetching posts:', error);
        return res.status(500).json({ state: 'error', message: 'Server error', error: error.message });
    }
});


router.get('/api/posts/:username/:postId', async (req, res) => {
    const username = req.params.username;
    const postId = req.params.postId;

    try {
        // Llamar a la función que obtendrá el post por ID
        const post = await firebaseHelper.getPostById(username, postId);

        if (!post) {
            return res.status(404).json({ state: 'error', message: 'Post not found' });
        }

        // Devolver el post como JSON
        res.status(200).json({ state: 'success', message: post });
    } catch (error) {
        console.log(error);
        res.status(500).json({ state: 'error', message: 'Server error', error: error.message });
    }
});



router.get('/api/users/:username', async (req, res) => {
    const username = req.params.username;

    try {
        const userInfo = await firebaseHelper.getUserInfo(username);

        if (userInfo) {
            res.json({ state: 'success', message: userInfo }); 
        } else {
            res.status(404).json({ state: 'error', message: 'Not Found' });
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ state: 'error', message: 'Server error', error: error.message });
    }
});



function validateAdmin(req, res, next) {
    let adminToken = req.get("x-auth");
    if (!adminToken || adminToken !== "admin") {
        res.status(403).send("");
    }
    next();
}

// Ruta para mostrar la página de agregar posts
router.get('/users/add-post/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'add_post.html'));
});

router.get('/users/:username/edit-post/:post_id', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'edit_post.html'));
});

router.post('/users/:username/post', async (req, res) => {
    const { title, content } = req.body;  
    const username = req.params.username;
    const token = req.headers['authorization']; 

    try {
        let result = await firebaseHelper.createPost(username, title, content, token);
        if (result.success) {
            res.redirect('/');  
        } else {
            res.status(400).send('Error al agregar el post');
        }
    } catch (error) {
        console.error('Error al agregar el post:', error);
        res.status(500).send('Error en el servidor al agregar el post');
    }
});

module.exports = router;
