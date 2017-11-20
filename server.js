﻿const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const sqlDbFactory = require('knex');
const _ = require("lodash");

/**
 * The db object to perform queries on
 */
let sqlDb;

/**
 * this method initialise the database, using sqlite if is run locally, postgre if run on heroku
 */
function initSqlDB() {
    /* Locally we should launch the app with TEST=true to use SQLlite:

     > TEST=true node ./index.js

     */
    /* todo remove this example
    if (process.env.TEST) {
        sqlDb = sqlDbFactory({
            client: "sqlite3",
            debug: true,
            connection: {
                filename: "./Travlendar+DB.sqlite"
            },
            useNullAsDefault: true
        });
    } else {
        sqlDb = sqlDbFactory({
            debug: true,
            client: "pg",
            connection: process.env.DATABASE_URL,
            ssl: true
        });
    }
    */
}

//all the json files needed to build the database

//todo: let locationsList = require("./other/json/locations.json");

/**
 * This method creates the tables reading from the json files if the tables do not exist already
 */
function initDb() {

    //table for all locations
    /* todo remove this example
    sqlDb.schema.hasTable("locations").then(exists => {

        if (!exists) {
            sqlDb.schema
                .createTable("locations", table => {
                    table.integer("id");
                    table.string("name");
                    table.double("lng");
                })
                .then(() => {
                    return Promise.all(
                        _.map(locationsList, p => {
                            return sqlDb("locations").insert(p);
                        })
                    );
                });
        } else {
            return true;
        }
    });
    return;*/
}

/**
 * the port we want to run our app on
 */
let serverPort = process.env.PORT || 8080;

app.use(express.static(__dirname + "/public"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


/* REST entry point for locations */
/* todo remove
app.get("/locations", function(req, res) {
    let idLoc = _.get(req, "query.id", -1);
    let myQuery = sqlDb("locations");

    //we check if the query asks for just one location or for all of them
    if(idLoc == -1) {
        myQuery.then(result => {
            res.send(JSON.stringify(result));
        });
    } else if(idLoc != -1) {
        myQuery.where({id: idLoc}).then(result => {
            res.send(JSON.stringify(result));
        });
    }
});
*/


app.set("port", serverPort);

initSqlDB();
initDb();

/* Start the server on port 8080 */
app.listen(serverPort, function() {
  console.log(`Your app is ready at port ${serverPort}`);
});