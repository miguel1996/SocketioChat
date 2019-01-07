var mongoConfigs = require("./mongoConfigs");
var ObjectId = require('mongodb').ObjectID;

function insertUser(name,password){
    var db= mongoConfigs.getDB();
    db.collection('users').insertOne({name,password},function(err,result){
        if(err){
            console.log(err);
            return err;
        }else{
            return result;
        }
    });
}

function getAll(callback){
    var db= mongoConfigs.getDB();
    db.collection('users').find({}).toArray((err,result)=>{
        if(err){
            console.log(err);
            return err;
        }else{
            //console.log(result);
            callback(result);
           // return result;
        }
    });
}

function getId(user_name,callback){
    var db= mongoConfigs.getDB();
    db.collection('users').find({'name':user_name}).toArray((err,result)=>{
        if(err){
            console.log(err);
            return err;
        }else if(result.length == 0){
            return 0;
        }else callback(result[0]._id);
    });
}

function getOne(id,callback){
    var db= mongoConfigs.getDB();
    var o_id = new ObjectId(id);
    db.collection('users').find({'_id': o_id}).toArray((err,result)=>{
        if(err){
            console.log(err);
            return err;
        }else{
            callback(result[0]);
        }
    });
}

function exists(name,callback){
    var db= mongoConfigs.getDB();
    db.collection('users').find({'name':name}).toArray((err,result)=>{
        if(err){
            console.log(err);
            callback(err);
        }else if(result.length == 0){
            callback(false);
        }else callback(true);
    });
}

function auth(name,password,callback){
    var db= mongoConfigs.getDB();
    db.collection('users').find({'name':name,'password':password}).toArray((err,result)=>{
        if(err){
            console.log(err);
            callback(err);
        }else if(result.length == 0){
            callback(false);
        }else callback(true);
    });
}

module.exports = {
    insertUser, getAll,exists,getId,auth,getOne
};