var mongoConfigs = require("./mongoConfigs");

function insertMessage(details,user_id){
    var db= mongoConfigs.getDB();
    db.collection('public_messages').insertOne({details,user_id},function(err,result){
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
    db.collection('public_messages').find({}).sort({_id:-1}).limit(10).toArray((err,result)=>{
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

module.exports = {
    insertMessage, getPublic,
};