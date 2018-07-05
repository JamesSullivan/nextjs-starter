/**
 * next-auth.functions.js Example
 *
 * This file defines functions NextAuth to look up, add and update users.
 *
 * It returns a Promise with the functions matching these signatures:
 *
 * {
 *   find: ({
 *     id,
 *     email,
 *     emailToken,
 *     provider,
 *     poviderToken
 *   } = {}) => {},
 *   update: (user) => {},
 *   insert: (user) => {},
 *   remove: (id) => {},
 *   serialize: (user) => {},
 *   deserialize: (id) => {}
 * }
 *
 * Each function returns Promise.resolve() - or Promise.reject() on error.
 *
 * This specific example supports both MongoDB and NeDB, but can be refactored
 * to work with any database.
 *
 * Environment variables for this example:
 *
 * MONGO_URI=mongodb://localhost:27017/my-database
 * EMAIL_FROM=username@gmail.com
 * EMAIL_SERVER=smtp.gmail.com
 * EMAIL_PORT=465
 * EMAIL_USERNAME=username@gmail.com
 * EMAIL_PASSWORD=p4ssw0rd
 *
 * If you wish, you can put these in a `.env` to seperate your environment 
 * specific configuration from your code.
 **/

// Load environment variables from a .env file if one exists
require('dotenv').load()

// This config file uses MongoDB for User accounts, as well as session storage.
// This config includes options for NeDB, which it defaults to if no DB URI 
// is specified. NeDB is an in-memory only database intended here for testing.
const MYSQLClient = require('mysql')
// const NeDB = require('nedb')


// Use Node Mailer for email sign in
const nodemailer = require('nodemailer')
const nodemailerSmtpTransport = require('nodemailer-smtp-transport')
const nodemailerDirectTransport = require('nodemailer-direct-transport')

// Send email direct from localhost if no mail server configured
let nodemailerTransport = nodemailerDirectTransport()
if (process.env.EMAIL_SERVER && process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD) {
  nodemailerTransport = nodemailerSmtpTransport({
      host: process.env.EMAIL_SERVER,
      port: process.env.EMAIL_PORT || 25,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    })
}
        
module.exports = () => {
  return new Promise((resolve, reject) => {
    if (process.env.MYSQL_URI) { 
      // Connect to MongoDB Database and return user connection
      
      const connection = MYSQLClient.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'starter_user', 
        password: 'starterPW1!', 
        database: 'starter' 
      })
      connection.connect((err) => {
        if (err) return reject(err)
        console.log('Connected!');
        connection.query('SELECT * FROM users', (err,rows) => {
          if (err) return reject(err)
          console.log('Data received from Db:\n');
          console.log(rows);
        });
      });
      return resolve(connection)

      //if (err) return reject(err)
      //const dbName = process.env.MONGO_URI.split('/').pop().split('?').shift()
      //const db = mongoClient.db(dbName)
      //return resolve(db.collection('users'))
    } else {
      // If no MongoDB URI string specified, use NeDB, an in-memory work-a-like.
      // NeDB is not persistant and is intended for testing only.
      throw "No connection!";
    }  
  })
  .then(usersCollection => {
    return Promise.resolve({
      // If a user is not found find() should return null (with no error).
      find: ({id, email, emailToken, provider} = {}) => {
        let query = {}
 
        // Find needs to support looking up a user by ID, Email, Email Token,
        // and Provider Name + Users ID for that Provider
        if (id) {
          query = { _id: id }
        } else if (email) {
          query = { email: email }
        } else if (emailToken) {
          query = { emailToken: emailToken }
        } else if (provider) {
          query = { [`${provider.name}.id`]: provider.id }
        }
        console.log("\r\nquery: " + JSON.stringify(query));
        console.log("typeof query: " + typeof query);
        console.log("Object.keys(query): " + Object.keys(query))
        console.log("query[Object.keys(query)]: " + query[Object.keys(query)]);
        return new Promise((resolve, reject) => {
          let queryKey = Object.keys(query)
          let queryValue = query[Object.keys(query)] 
          let quote = typeof queryValue === "string" ? '\'' : ''
          console.log("SELECT id, jdoc FROM starter.users where jdoc->'$." + Object.keys(query) + "'=" + quote + queryValue + quote + ";")
          usersCollection.query("SELECT id, jdoc FROM starter.users where jdoc->'$." + Object.keys(query) + "'=" + quote + queryValue + quote+ ";", (err, dbuser) => {
            if (err) {
              console.error("query response user error: " + err)
              return reject(err)
            } else {
            let user = null
            console.log("dbuser[0]: " + JSON.stringify(dbuser[0]))
            if(dbuser[0] !== undefined) {
              user = JSON.parse(dbuser[0].jdoc)
              user._id = dbuser[0].id
              console.log("Object.keys(user): " + Object.keys(user))
              console.log("user.email: " + user.email);
            }
            console.log("user: " + JSON.stringify(user));
            return resolve(user)
            }
          })
        })
      },
      // The user parameter contains a basic user object to be added to the DB.
      // The oAuthProfile parameter is passed when signing in via oAuth.
      //
      // The optional oAuthProfile parameter contains all properties associated
      // with the users account on the oAuth service they are signing in with.
      //
      // You can use this to capture profile.avatar, profile.location, etc.
      insert: (user, oAuthProfile) => {
        return new Promise((resolve, reject) => {
          user._id = 0
          console.log("Inserting user: " + JSON.stringify(user))
          usersCollection.query('INSERT INTO starter.users SET jdoc=?', JSON.stringify(user), (err, response) => {
            console.log("Inserting user started!")
            if (err) {
              console.warn(err)
              return reject(err)
            }
            console.log(response)
            // if using a work-a-like we may need to add it from the response.
            if (response.insertId) user._id = response.insertId
            return resolve(user)
          })
        })
      },
      // The user parameter contains a basic user object to be added to the DB.
      // The oAuthProfile parameter is passed when signing in via oAuth.
      //
      // The optional oAuthProfile parameter contains all properties associated
      // with the users account on the oAuth service they are signing in with.
      //
      // You can use this to capture profile.avatar, profile.location, etc.
      update: (user, profile) => {
        console.log("Updating user: " + JSON.stringify(user))
        return new Promise((resolve, reject) => {
          // usersCollection.update({_id: user._id}, user, {}, (err) => {
          console.log("UPDATE starter.users SET jdoc=? where id ='" + user._id + "';")
          usersCollection.query("UPDATE starter.users set jdoc=? where id =" + user._id + ";", JSON.stringify(user), (err, dbuser) => {  
            if (err) return reject(err)
            return resolve(user)
          })
        })
      },
      // The remove parameter is passed the ID of a user account to delete.
      //
      // This method is not used in the current version of next-auth but will
      // be in a future release, to provide an endpoint for account deletion.
      remove: (id) => {
        console.log("Removing user: " +  JSON.stringify(user))
        return new Promise((resolve, reject) => {
          // usersCollection.remove({_id: id}, (err) => {
            usersCollection.query("DELETE FROM starter.users where id =" + id + ";", (err, dbuser) => {  
            if (err) return reject(err)
            return resolve(true)
          })
        })
      },
      // Seralize turns the value of the ID key from a User object
      serialize: (user) => {
        console.log("\r\nSerializing user: " + JSON.stringify(user))
        // Supports serialization from Mongo Object *and* deserialize() object
        if (user.id) {
          // Handle responses from deserialize()
          return Promise.resolve(user.id)
        } else if (user._id) {
          // Handle responses from find(), insert(), update() 
          return Promise.resolve(user._id) 
        } else {
          return Promise.reject(new Error("Unable to serialise user"))
        }
      },
      // Deseralize turns a User ID into a normalized User object that is
      // exported to clients. It should not return private/sensitive fields,
      // only fields you want to expose via the user interface.
      deserialize: (id) => {
        console.log("\r\nDeserializing user id: " + id)
        return new Promise((resolve, reject) => {
         // usersCollection.findOne({ _id: id }, (err, user) => {
          console.log("SELECT id, jdoc FROM starter.users where id='" + id + "';")
          usersCollection.query("SELECT id, jdoc FROM starter.users where id=" + id + ";", (err, dbuser) => {  
            if (err) return reject(err)
              
            // If user not found (e.g. account deleted) return null object
            if (dbuser[0] === undefined) return resolve(null)
            let user = null
            console.log("dbuser[0]: " + JSON.stringify(dbuser[0]))
            if(dbuser[0] !== undefined) {
              user = dbuser[0].jdoc
              return resolve({
                id: dbuser[0].id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                admin: user.admin || false
              })
          }
          })
        })
      },
      // Define method for sending links for signing in over email.
      sendSignInEmail: ({
        email = null,
        url = null
        } = {}) => {
        nodemailer
        .createTransport(nodemailerTransport)
        .sendMail({
          to: email,
          from: process.env.EMAIL_FROM,
          subject: 'Sign in link',
          text: `Use the link below to sign in:\n\n${url}\n\n`,
          html: `<p>Use the link below to sign in:</p><p>${url}</p>`
        }, (err) => {
          if (err) {
            console.error('Error sending email to ' + email, err)
          }
        })
        if (process.env.NODE_ENV === 'development')  {
          console.log('Generated sign in link ' + url + ' for ' + email)
        }   
      },
    })
  })
}