const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const serviceAccount = require("./emanaulproject-firebase-adminsdk-fijg5-fafeb9a237.json"); // Replace with the actual path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://emanaulproject-default-rtdb.firebaseio.com/", // Replace with your database URL
});
const db = admin.database(); // Access Firebase Realtime Database
const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use(express.static('public'))
app.post('/adduser',(req,res)=>{
  const phoneNumber = req.body.phoneNumber;
    const email = req.body.email;
  const fullname = req.body.name;
  const address = req.body.address;
  const userRef = db.ref("users/" + phoneNumber);
      // add user 
      userRef.set({ 
        name: fullname,
        address:address,
        email:email
       }, (error) => {
        if (error) {
          res.set("Content-Type", "text/plain");
          res.send(`END Error regestering user: ${error}`);
        } else {
          res.set("Content-Type", "text/plain");
          res.send(`you have been regestered successfuly now you can start using our services `); 
        }
      });
})
app.post("/addcase", (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  const symptoms = req.body.symptoms;
  const userRef = db.ref("cases/");

  // add user
  userRef.set(
    {
      symptoms: symptoms,
      phoneNumber: phoneNumber,
    },
    (error) => {
      if (error) {
        res.set("Content-Type", "text/plain");
        res.send(`END Error regestering user: ${error}`);
      } else {
        res.set("Content-Type", "text/plain");
        res.send(
          `the doctor are diagnosing your symptoms shortly you will receive medication`
        );
      }
    }
  );
});
app.post("/ussd", (req, res) => {
  const sessionId = req.body.sessionId;
  const serviceCode = req.body.serviceCode;
  const phoneNumber = req.body.phoneNumber;
  const text = req.body.text;
  let response = ""; // Response to be sent to the client

  if (text === "") {
    // This is the first request. Show the main menu
    response = `CON Welcome to My Pharmacy Service\n`;
    response += `1. Register\n`;
    response += `2. Get Diagnosis\n`;
    response += `3. Get Cost Estimates\n`;
    response += `4. Exit`;
    res.set("Content-Type", "text/plain");
    res.send(response);
    return;
  } else if (text === "1") {
    response = `CON Please enter your name:`;
    res.set("Content-Type", "text/plain");
    res.send(response);
    return;
  } else if (text.startsWith("1*0*")) {
    const name = text.split("*")[1]; // Extract the name
    const userRef = db.ref("users/" + phoneNumber);

    // Update user name
    userRef.set({
       email:'',
       name: name }, (error) => {
      if (error) {
        res.set("Content-Type", "text/plain");
        res.send(`END Error saving data: ${error}`);
      } else {
        res.set("Content-Type", "text/plain");
        res.send(`CON Please enter your address:`); // After saving the name, prompt for the address
      }
    });
    return;
  } else if (text.startsWith("1*1*")) {
    const address = text.split("*")[2]; // Extract the address
    const userRef = db.ref("users/" + phoneNumber);

    // Update user address
    userRef.update({
       address: address }, (error) => {
      if (error) {
        res.set("Content-Type", "text/plain");
        res.send(`END Error saving data: ${error}`);
      } else {
        res.set("Content-Type", "text/plain");
        res.send(`END Registration complete. You can now use our services.`);
      }
    });
    return;
  } else if (text==="2") {
    response = "CON Enter symptoms:";
    res.set("Content-Type", "text/plain");
    res.send(response);
    return;
  } else if (text.startsWith("2*")) {
    const symptoms = text.split("*")[1]; // Extract symptoms
    const userRef = db.ref("cases");

    // Add new case to Firebase
    userRef.push(
      {
        symptoms: symptoms,
        phoneNumber: phoneNumber,
      },
      (error) => {
        if (error) {
          res.set("Content-Type", "text/plain");
          res.send(`END Error saving data: ${error}`);
        } else {
          res.set("Content-Type", "text/plain");
          res.send(
            `END Your symptoms have been submitted. Doctors are diagnosing, and you will receive your medication soon.`
          );
        }
      }
    );
    return;
  }

  // If none of the conditions are met, send a default response
  res.set("Content-Type", "text/plain");
  res.send(`END Invalid option. Please try again.`);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
