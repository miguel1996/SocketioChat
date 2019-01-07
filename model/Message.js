var mongoConfigs = require("./mongoConfigs");


function insertMessage(details,user_id,user_name){
    var db= mongoConfigs.getDB();
    var now = Date.now();
    db.collection('public_messages').insertOne({details,user_id,user_name,timestamp:now},function(err,result){
        if(err){
            console.log(err);
            return err;
        }else{
            return result;
        }
    });
}

function getPublic(callback){
    var db= mongoConfigs.getDB();
    db.collection('public_messages').find({}).sort({_id:-1}).limit(5).toArray((err,result)=>{
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

function getPrivate(target,sender,callback){
    var db= mongoConfigs.getDB();
    // db.collection('private_messages').find({$and:[{$or:[{user_id:target},{user_id:sender}]},{$or:[{target_user:target},{target_user:sender}]}]}).sort({_id:-1}).limit(5).toArray((err,result)=>{
    db.collection('private_messages').find({$or:[{user_name:sender,target_user:target},{user_name:target,target_user:sender}]}).sort({_id:-1}).limit(5).toArray((err,result)=>{
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

function insertPrivateMessage(details,user_id,user_name,target_user){
    var db= mongoConfigs.getDB();
    var now = Date.now();
    db.collection('private_messages').insertOne({details,user_id,user_name,timestamp:now,target_user},function(err,result){
        if(err){
            console.log(err);
            return err;
        }else{
            return result;
        }
    });
}

module.exports = {
    insertMessage, getPublic,insertPrivateMessage,getPrivate
};



