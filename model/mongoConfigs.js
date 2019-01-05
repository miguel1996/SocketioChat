const mongo = require("mongodb");
var MongoClient = mongo.MongoClient;
var db;

const url = 'mongodb://localhost:27017';
const dbName = 'grupo6';

module.exports = {
    connect: function (callback) {
        MongoClient.connect(url, function (err, client) {
            if (!err) {
                db = client.db(dbName);
                callback();
            }
            else {
                console.log(err);
            }
        });
    },
    getDB: function () {
        return db;
    }
}