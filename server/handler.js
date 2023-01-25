const { MongoClient, ObjectId } = require("mongodb");

require("dotenv").config();
const { MONGO_URI } = process.env;

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// function to detect numbers in string
const hasNumbers = (string) => {
  if (/\d/.test(string)) {
    return true;
  }
  return false;
};

// function to detect if postal code is a postal code
const isPostalCode = (string) => {
  if (/^[A-Za-z]\d[A-Za-z]\s\d[A-Za-z]\d$/.test(string)) {
    return false;
  }
  return true;
};

// Require `PhoneNumberFormat`
const phoneUtil = require("google-libphonenumber").PhoneNumberUtil.getInstance();
// Get an instance of `PhoneNumberUtil`
const PNF = require("google-libphonenumber").PhoneNumberFormat;

const isCanadianNumber = (phone) => {
  try {
    // Parse number with country code and keep raw input
    const phoneNumber = phoneUtil.parseAndKeepRawInput(phone, "CA");
    // tests whether a phone number is valid for a certain region.
    if (phoneUtil.isValidNumber(phoneNumber)) {
      // If the phone number is valid, it formats the phone number in international format using the format method of phoneUtil instance, and returns the formatted number.
      return phoneUtil.format(phoneNumber, PNF.INTERNATIONAL);
    } else {
      return false;
    }
  } catch (err) {
    return false;
  }
};

// POST endpoint
const information = async (req, res) => {
  // connects to mongodb
  const client = new MongoClient(MONGO_URI, options);
  // filters out bad words
  const Filter = require("bad-words");
  const filter = new Filter();
  // validates emails that they are an actual email
  const validator = require("validator");

  // connects to database
  await client.connect();
  // our db cluster name
  const db = client.db("Project");
  // our database name
  const members = await db.collection("users");

  // req.body for users to enter
  const user = {
    given_name: req.body.given_name,
    family_name: req.body.family_name,
    email: req.body.email,
    phone: req.body.phone,
    postal: req.body.postal,
  };
  console.log("user", user);

  try {
    switch (true) {
      case !user.given_name || !user.family_name || !user.email || !user.phone || !user.postal:
        throw new Error("Missing required fields: please fill in all of the fields");
      // Check if the given name contains any numbers
      case hasNumbers(user.given_name):
        // error message
        throw new Error("Your given name cannot contain numbers");
      // Check if the family name contains any numbers
      case hasNumbers(user.family_name):
        // error message
        throw new Error("Your family name cannot contain numbers");
      // Check if the given or family name contains any bad words
      case filter.isProfane(user.given_name) || filter.isProfane(user.family_name):
        // error message
        throw new Error("Your name cannot contain bad words");
      // Check if the phone number is a valid Canadian number
      case !isCanadianNumber(user.phone):
        // error message
        throw new Error("Please enter a valid phone number");
      // check if the postal code is valid
      case isPostalCode(user.postal):
        // error message
        throw new Error("Please enter a valid postal code");
      // Check if the email address is valid
      case !validator.isEmail(user.email):
        // error message
        throw new Error("Please enter a valid email address");
      // If all validation checks pass, insert the user information into the database
      default:
        const newClient = await members.insertOne({
          given_name: user.given_name,
          family: user.family_name,
          email: user.email,
          phone: user.phone,
          postal: user.postal,
        });
        // Respond with a status of 201 and a message that the information has been sent
        res.status(201).json({ stataus: 201, data: newClient, message: "info sent" });
    }
  } catch (err) {
    // If an error is thrown, respond with a status of 400 and the error message
    res.status(400).json({ status: 400, message: err.message });
  } finally {
    // Close the connection to the database
    client.close();
  }
};

//   if (!user.given_name || !user.family_name || !user.email || !user.phone) {
//     res.status(400).json({ status: 400, message: "Missing required fields: please fill in all of the fields" });
//     // denies users adding numbers in their given name if it was sent
//   } else if (hasNumbers(user.given_name)) {
//     res.status(400).json({status: 400, data: user, message: "Your given name can't contain numbers"});
//     // denies users adding numbers in their family name if it was sent
//   } else if (hasNumbers(user.family_name)) {
//     res.status(400).json({status: 400, data: user, message: "Your family name can't contain numbers"})
//     // if the users given name or family name contains a bad word, deny the info being sent
//   } else if (filter.isProfane(user.given_name) || filter.isProfane(user.family_name)) {
//     res.status(400).json({ status: 400, message: "Your name contains bad words" });

//   } else if (!isCanadianNumber(user.phone)) {
//   res.status(400).json({staus: 400, message: "Please enter a valid phone number"})

//   } else if (await validator.isEmail(user.email)) {
//     const newClient = await members.insertOne({
//       given_name: user.given_name,
//       family_name: user.family_name,
//       email: user.email,
//     });
//     res.status(201).json({ status: 201, data: newClient, message: "info sent" });
//     console.log("newMember", newClient);
//   } else {
//     res.status(500).json({ status: 500, message: "somethign went wrong" });
//   }
//   client.close();
// };

module.exports = {
  information,
};