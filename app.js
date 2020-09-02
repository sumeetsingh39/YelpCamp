var express = require("express"),
app = express(),
bodyParser = require("body-parser"),
mongoose  = require("mongoose"),
Campground = require("./models/campgrounds.js"),
Comment = require("./models/comment.js"),
passport = require("passport"),
localStrategy = require("passport-local"),
User   =  require("./models/user.js"),
seedDB = require("./seeds.js");
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+"/public"));
mongoose.connect("mongodb://localhost:27017/yelp_camp",{useNewUrlParser:true,useUnifiedTopology:true});

//Passport Configuration

app.use(require("express-session")({
    secret:"Can't tell",
    resave : false,
    saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser);
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){

    res.locals.currentUser = req.user;
    next();

});

seedDB();
app.get("/",function(req,res){

    res.render("landing");
});

app.get("/campgrounds",(req,res)=>{
    Campground.find({}, function(err,campgrounds){
        if(err){
            console.log(err);
        }
        else{
            // console.log(campgrounds);
            res.render("campgrounds/index",{campgrounds:campgrounds});
        }

    })


    // res.render("campgrounds",{campgrounds:campgrounds});
});

app.post("/campgrounds", (req, res)=>{
    var name = req.body.name;
    var image = req.body.image;
    var description = req.body.description;
    var newCampGround = {
        name:name,
        image:image,
        description:description
    };
    // campgrounds.push(newCampGround);

    //Create New Campground
    Campground.create(newCampGround,function(err,campground){
        if(err){
            console.log(err);
        }
        else{
            res.redirect("/campgrounds");
        }
    });

    //res.send("POST route");
    
});
app.get("/campgrounds/new", (req, res)=>{

    res.render("campgrounds/new");
});

app.get("/campgrounds/:id",(req,res)=>{
    Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground){
        if(err){
            console.log(err);
        }
        else{
            //console.log(foundCampground);
            res.render("campgrounds/show",{campground:foundCampground});
        }


    });

});

//Comments Routes
//=============================

app.get("/campgrounds/:id/comments/new",isLoggedIn,(req,res)=>{
    Campground.findById(req.params.id,function(err,campground){
        if(err){
            console.log(err);
        }
        else{
            res.render("comments/new",{campground:campground});
        }
    });
    

});

app.post("/campgrounds/:id/comments",isLoggedIn,(req,res)=>{
    Campground.findById(req.params.id,(err,foundCampground)=>{
        if(err){
            console.log(err);
            res.redirect("/campgrounds/"+foundCampground._id);
        }
        else{
            Comment.create(req.body.comment,(err,comment)=>{
                if(err){
                    console.log(err);
                }
                else{
                    foundCampground.comments.push(comment); 
                    foundCampground.save();
                    res.redirect("/campgrounds/"+foundCampground._id)
                }

            });
        }

    });

});

//Auth Routes

app.get("/register",(req,res)=>{

    res.render("register");

});

// app.post("/register",(req,res)=>{

//     var newUser = new User({username:req.body.username});
//     User.register(newUser,req.body.password, (err,usr)=>{
//         if(err){
//             console.log(err);
//             return res.render("register");
//         }
//         else{
//             console.log("Here");
//             passport.authenticate("local")(req,res,()=>{
//             res.redirect('/campgrounds');
//             });
//         }

//     });

// });

app.get("/login", (req, res)=>{

    res.render("login");
});
app.post("/login",passport.authenticate("local",{
    successRedirect:"/campgrounds" ,
    failureRedirect:"/login"
}),function(req,res){
});

app.get("/logout",function(req,res){

    req.logout();

})

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    else{
        res.redirect("/login");
    }
}
//=============================
app.listen(3000,()=>{

    console.log("Serving on port 3000");
});