const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing.js");
const port=3030;
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const asyncWrap=require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
const { listingSchema } = require('./schema.js');
 

app.use(methodOverride('_method'))
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));


main().then(()=>{
    console.log("Connected Successfully ");
}).catch((err)=>{
    console.log(err);
});


async function main(){
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}


app.get("/",(req,res)=>{
    res.send("I am at root");
});

//validation using joi here wrote as fn and passing 
const validateListing= (req,res,next)=>{
    let {error}=listingSchema.validate(req.body.listing);
    if(error){
        let errMsg=error.details.map((el) => el.message).join(",");
        throw new ExpressError(400,errMsg);
    }else{
        next();
    }
};




// function asyncWrap(fn){   //created  a file and required 
//     return function (req,res,next){
//         fn(req,res,next).catch((err)=> next(err));
//     }
// }



app.get("/getListing",asyncWrap(async (req,res)=>{
    let sampleList=new Listing({
        title:"My new Villa",
        description:"By Beach area",
        price:1200,
        location:"Near Goa,Gokarna",
        country:"India",
    });

    await sampleList.save();
    console.log("List saved");
    res.send("Success testing");
}));

//index routing 
app.get("/listings",asyncWrap(async (req,res)=>{
    const allListings=await Listing.find({});
    res.render("listings/index.ejs",{allListings});
}));


//new form
app.get("/listings/new",(req,res)=>{
    res.render("listings/new.ejs");
});




//Creating new one POST req

app.post("/listings",validateListing,asyncWrap(async (req,res)=>{
    // not using joi validation as its giving me undefined in values
    // console.log('Listing Schema:', listingSchema);  // Log the schema
    // console.log('Request Body:', req.body);  // Log the entire request body
    // let result=listingSchema.validate(req.body);
    // console.log("Validation result : ",result);
    // if (result.error) {
    //     console.log(result.error.details);  // Log the validation error details
    //     return res.status(400).send(result.error.details);
    // }
    let newList=new Listing(req.body.listing);
    await newList.save();
    res.redirect("/listings");
}));



//edit form get

app.get("/listings/:id/edit",asyncWrap(async (req,res)=>{
    let {id}=req.params;
    console.log(id);
    let editList=await Listing.findById(id);
    console.log(editList);
    res.render("listings/edit.ejs",{editList});
}));


//show route
app.get("/listings/:id",asyncWrap(async (req,res)=>{
    let {id}=req.params;
    console.log(id);
    let reqData=await Listing.findById(id);
    console.log(reqData);
    res.render("listings/show.ejs",{reqData});
}));



//update route editng put
app.put("/listings/:id",asyncWrap(async (req,res)=>{
    let {id}=req.params;
    let updatedList=await Listing.findByIdAndUpdate(id,req.body.listing,{new:true});
    console.log(updatedList);
    res.redirect("/listings");
}));

//delete
app.delete("/listings/:id",asyncWrap(async (req,res)=>{
    let {id}=req.params;
    let deletedList=await Listing.findByIdAndDelete(id);
    console.log(deletedList);
    res.redirect("/listings");
}));

//for invalid route search

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!"));
});

//middleware

app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something error occured"}=err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("listings/error.ejs",{err});   
});


app.listen(port,()=>{
    console.log("Listening to port 3030");
});