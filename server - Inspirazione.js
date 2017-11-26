const express = require("express");
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
    if (process.env.TEST) {
        sqlDb = sqlDbFactory({
            client: "sqlite3",
            debug: true,
            connection: {
                filename: "./sacroCuoreDB.sqlite"
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
}

//all the json files needed to build the database

let locationsList = require("./other/json/locations.json");

let locationsServiceList = require("./other/json/location-service.json");

let servicesList = require("./other/json/services.json");

let doctorsList = require("./other/json/doctors.json");

let areasList = require("./other/json/areas.json");

let doctorsServices = require("./other/json/doctorsServices.json");

let photoGalleryList = require("./other/json/photoGallery.json");


/**
 * This method creates the tables reading from the json files if the tables do not exist already
 */
function initDb() {

    //table for all locations
    sqlDb.schema.hasTable("locations").then(exists => {

        if (!exists) {
            sqlDb.schema
                .createTable("locations", table => {
                    table.integer("id");
                    table.string("name");
                    table.string("address");
                    table.string("phone");
                    table.string("fax");
                    table.string("email");
                    table.text("description");
                    table.text("highway");
                    table.text("train");
                    table.text("airplane");
                    table.double("lat");
                    table.double("lng");
                    table.string("imgLoc");
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

    //table for which service are performed in which location
    sqlDb.schema.hasTable("locations-service").then(exists => {

        if (!exists) {
            sqlDb.schema
                .createTable("locations-service", table => {
                    table.string("location");
                    table.string("service");
                })
                .then(() => {
                    return Promise.all(
                        _.map(locationsServiceList, p => {
                            return sqlDb("locations-service").insert(p);
                        })
                    );
                });
        } else {
            return true;
        }
    });

    //table of the images of the locations on the photo gallery
    sqlDb.schema.hasTable("photoGallery").then(exists => {

        if (!exists) {
            sqlDb.schema
                .createTable("photoGallery", table => {
                    table.integer("id");
                    table.string("img");
                })
                .then(() => {
                    return Promise.all(
                        _.map(photoGalleryList, p => {
                            return sqlDb("photoGallery").insert(p);
                        })
                    );
                });
        } else {
            return true;
        }
    });

    //table for all services
    sqlDb.schema.hasTable("services").then(exists => {
        if (!exists) {
            sqlDb.schema
                .createTable("services", table => {
                    table.integer("id");
                    table.string("searchname");
                    table.string("imgser");
                    table.string("name");
                    table.text("shortdescription");
                    table.text("description");
                    table.text("visittime");
                    table.text("mealtime");
                    table.text("preparation");
                    table.text("statistics");
                })
                .then(() => {
                    return Promise.all(
                        _.map(servicesList, p => {
                            return sqlDb("services").insert(p);
                        })
                    );
                });
        } else {
            return true;
        }
    });

    //table to know which doctor offers which service
    sqlDb.schema.hasTable("doctorsServices").then(exists => {

        if (!exists) {
            sqlDb.schema
                .createTable("doctorsServices", table => {
                    table.integer("id");
                    table.integer("doctorid");
                    table.integer("serviceid");
                })
                .then(() => {
                    return Promise.all(
                        _.map(doctorsServices, p => {
                            return sqlDb("doctorsServices").insert(p);
                        })
                    );
                });
        } else {
            return true;
        }
    });


    //table for all doctors
    sqlDb.schema.hasTable("doctors").then(exists => {
        if (!exists) {
            sqlDb.schema
                .createTable("doctors", table => {
                    table.integer("singledoctorid");
                    table.string("name");
                    table.string("surname");
                    table.string("img");
                    table.string("birthdate");
                    table.integer("arearespid");
                    table.integer("servrespid");
                    table.integer("locationid");
                    table.text("description");
                    table.string("curriculum");
                })
                .then(() => {
                    return Promise.all(
                        _.map(doctorsList, p => {
                            return sqlDb("doctors").insert(p);
                        })
                    );
                });
        } else {
            return true;
        }
    });

    //table for all areas
    sqlDb.schema.hasTable("areas").then(exists => {
        if (!exists) {
            sqlDb.schema
                .createTable("areas", table => {
                    table.integer("id");
                    table.string("name");

                })
                .then(() => {
                    return Promise.all(
                        _.map(areasList, p => {
                            return sqlDb("areas").insert(p);
                        })
                    );
                });
        } else {
            return true;
        }
    });

    return;
}

/**
 * the port we want to run our app on
 */
let serverPort = process.env.PORT || 5000;

app.use(express.static(__dirname + "/public"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


/* REST entry point for locations */
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


/* REST entry point for services in a certain location */
app.get("/location-service", function(req, res) {
    let nameSer = _.get(req, "query.service", "none");
    let nameLoc = _.get(req, "query.location", "none");
    let myQuery = sqlDb("locations-service");

    if (nameSer != "none") {
     myQuery.where({service: nameSer})
         .leftJoin("locations", "locations.name", "locations-service.location").then(result => {
         console.log("*****");
         console.log(result);
         console.log("*****");
         res.send(JSON.stringify(result));
     });
     } else if(nameLoc != "none") {
        myQuery.where({location: nameLoc})
            .leftJoin("services", "services.searchname", "locations-service.service").then(result => { //, "services.searchname", "locations-service.service"
            console.log("*****");
            console.log(result);
            console.log("*****");
            res.send(JSON.stringify(result));
        });
    }
});

/**
 * Builds the class containing the bindings of the query, i.e. the where clause
 * @param request the text of the REST GET request in order to perform loadhash on it
 * @constructor
 */
function WhereClause (request) {
    let tmp;
    tmp = _.get(request, "query.id", -1);
    if(tmp !== -1)
        this.singledoctorid = parseInt(tmp);
    tmp = _.get(request, "query.arearespid", -1);
    if(tmp !== -1)
        this.arearespid = parseInt(tmp);
    tmp = _.get(request, "query.servrespid", -1);
    if(tmp !== -1)
        this.servrespid = parseInt(tmp);
    tmp = _.get(request, "query.locationid", -1);
    if(tmp !== -1)
        this.locationid = parseInt(tmp);
}

/* REST entry point for Doctors */
app.get("/doctorsreq", function(req, res) {

    //we create the where clause to pass to the query
    let whereClause = new WhereClause(req);

    let myQuery = sqlDb("doctors");

    //query limit, for page display client side
    let start = parseInt(_.get(req, "query.start", 0));
    let limit = parseInt(_.get(req, "query.limit", 6));

    console.log(whereClause);

    //query to obtain all doctors that respect the query where clause. We always present them in alphabetic order
    myQuery.limit(limit).offset(start).select(sqlDbFactory.raw('doctors.singledoctorid, doctors.name, ' +
        'doctors.surname, doctors.img, doctors.birthdate, doctors.arearespid, ' +
        'doctors.servrespid, doctors.locationid, doctors.description, doctors.curriculum, ' +
        'areas.name as arearespname, locations.name as locationname, services.name as servrespname'))
        .leftJoin('areas', 'doctors.arearespid', 'areas.id')
        .leftJoin('services', 'doctors.servrespid', 'services.id')
        .leftJoin('locations', 'doctors.locationid', 'locations.id')
        .where(whereClause)
        .orderBy('surname', 'asc')
        .then(result => {

            //no we have to discover to every doctor what services he offers, for simplicity and clearness we make
            //a subquery, faster than grouping results afterwards

            var arrayLength = result.length;

            //this array will contain all the promises returned from each query
            let queryPromises = [];

            //one query for each doctor to discover his services
            for (var i = 0; i < arrayLength; i++) {
                let servicesQuery = sqlDb("services");
                let temp = parseInt(result[i].singledoctorid);
                queryPromises.push(servicesQuery.select('services.id', 'services.name')
                    .leftJoin('doctorsServices', 'services.id', 'doctorsServices.serviceid')
                    .where('doctorsServices.doctorid', temp));
            }

            //make the then return a new promise just to signal the method is ended and then consume all the promises in Promise.all()
            Promise.all(queryPromises)
                .then((results) => {

                    var key, count = 0;
                    for(key in results) {
                        if(results.hasOwnProperty(key)) {

                            result[count].services = [];

                            var count2 = 0;
                            for(service in results[count]) {
                                result[count].services.push(results[count][count2]);
                                count2++;
                            }

                            count++;
                        }
                    }

                    console.log(result);
                res.send(JSON.stringify(result));

                });
    });

});

/*REST entry point for all services */
app.get("/doctorsServices", function(req, res) {
    let idSer = parseInt(_.get(req, "query.serviceid", -1));
    let myQuery = sqlDb("doctorsServices");

    if(idSer != -1) {
        myQuery.select(sqlDbFactory.raw('doctors.singledoctorid, doctors.name, doctors.surname')).
        where({serviceid: idSer}).leftJoin("doctors", "doctorsServices.doctorid", "doctors.singledoctorid").then(result => {
            res.send(JSON.stringify(result));
        });
    }
    else  {
        myQuery.select(sqlDbFactory.raw('doctors.singledoctorid, doctors.name, doctors.surname'))
            .leftJoin("doctors", "doctorsServices.doctorid", "doctors.singledoctorid").then(result => {
            res.send(JSON.stringify(result));
        });
    }
});

/*REST entry point for all services */
app.get("/services", function(req, res) {
    let nameSer = _.get(req, "query.searchname", "none");
    let idSer = parseInt(_.get(req, "query.id", -1));
    let myQuery = sqlDb("services");

    if(nameSer === "none" && idSer == -1) {
        myQuery.then(result => {
            res.send(JSON.stringify(result));
        });
    } else if(idSer != -1) {
        myQuery.where({id: idSer}).then(result => {
            res.send(JSON.stringify(result));
        });
    }

    else if(nameSer != "none") {
        myQuery.where({searchname: nameSer}).then(result => {
            res.send(JSON.stringify(result));
        });
    }
});


app.get("/imgLocation", function(req, res) {
    let idLoc = parseInt(_.get(req, "query.id", -1));
    let myQuery = sqlDb("photoGallery");

    if(idLoc != -1) {
        myQuery.where({id: idLoc}).then(result => {
            console.log(result);
            res.send(JSON.stringify(result));
        });
    }
});

/*REST entry point for all areas */
app.get("/areas", function(req, res) {
    let myQuery = sqlDb("areas");

    myQuery.then(result => {
        res.send(JSON.stringify(result));
    });
});

/*Create transport for sending email confirmations*/
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'polimi.hyp.2017.team.10459400@gmail.com',
        pass: 'P0l1m1Hyp'
    }
});

/*REST entry point for booking form */
app.post("/booking", function(req, res) {

    console.log(req.body);

    //from id of service selected we want to send the customer the name, so we make a query
    let myQuery = sqlDb("services");
    myQuery.select('name').where({id: req.body.service}).then(result => {

    console.log(result);

    //we create the options for the mail, the sender, the detination address and the body of the mail generated from
    //the informations we received from the post
    var mailOptions = {
        from: 'polimi.hyp.2017.team.10459400@gmail.com',
        to: req.body.email,
        subject: 'Prenotazione Sacro Cuore',
        text: 'Buongiorno, ' + req.body.name + ' ' + req.body.surname + ' grazie per la tua prenotazione.\n'
        + 'Eccone un riepiogo:\n'
        + 'Data: ' + req.body.date
        + '\nServizio: ' + result[0].name
        + '\n-----------------\n'
        + 'Messaggio inviato automaticamente come risposta al submit del form di prenotazione del gruppo polimi.hyp.2017.team.10459400, Amadelli, Artoni, Campanella'
    };

    //we send the email
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    });

    //if we arrive here no error was generated
    res.send({error: "none"});

});

/*REST entry point for general request of info form */
app.post("/requestinfo", function(req, res) {

    console.log(req.body);

    //we create the options for the mail, the sender, the detination address and the body of the mail generated from
    //the informations we received from the post
    var mailOptions = {
        from: 'polimi.hyp.2017.team.10459400@gmail.com',
        to: req.body.email,
        subject: 'Richiesta di informazioni',
        text: 'Buongiorno, abbiamo ricevuto la sua richiesta di informazioni, che riportiamo sotto.\n'
        + 'La informiamo che riceviamo molte mail al giorno e la preghiamo dunque di avere pazienza, un nostro' +
        'operatore le risponderà a breve. \n' +
        'Ecco il testo della sua richiesta: \n\n'
        + req.body.text
        + '\n-----------------\n'
        + 'Messaggio inviato automaticamente come risposta al submit del form di prenotazione del gruppo polimi.hyp.2017.team.10459400, Amadelli, Artoni, Campanella'
    };

    //we send the email
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    //if we arrive here no error was generated
    res.send({error: "none"});

});


app.set("port", serverPort);

initSqlDB();
initDb();

/* Start the server on port 3000 */
app.listen(serverPort, function() {
  console.log(`Your app is ready at port ${serverPort}`);
});
