const jwt = require("jsonwebtoken");
const appRootPath = require("app-root-path");
const fs = require("fs").promises;
const {
  STATUS_CODE,
  SOCKET_EVENT,
  SERVER_MESSAGE_TYPE,
} = require("./constants");

// function orMiddleware(middleware1, middleware2) {
//   return function(req, res, next) {
//     // Track if any of the middlewares has called `next()`
//     let calledNext = false;

//     function nextWrapper() {
//       if (!calledNext) {
//         calledNext = true;
//         next();
//       }
//     }

//     // Run middleware1, if it calls next(), skip middleware2
//     middleware1(req, res, nextWrapper);

//     // If middleware1 doesn't call next, run middleware2
//     if (!calledNext) {
//       middleware2(req, res, nextWrapper);
//     }
//   };
// }

const formatFilePath = (fileName) => {
  const path = appRootPath + "\\public\\upload\\" + fileName;
  return path;
};

const generateToken = (user, secret_key, expire) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
    },
    secret_key,
    { expiresIn: expire }
  );
};

const generateVerifyCode = () => {
  const min = Math.pow(10, 6 - 1);
  const max = Math.pow(10, 6) - 1;
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num.toString();
};

function generateRandomPassword(length) {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*";

  const allChars = lowercase + uppercase + numbers + specialChars;

  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars[randomIndex];
  }

  return password;
}

const readAndTransformImageToBase64 = async (imagePath) => {
  try {
    const data = await fs.readFile(imagePath);
    const base64Image = data.toString("base64");
    const imageData = "data:image/jpeg;base64," + base64Image;
    return imageData;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const formatResponse = (
  res,
  data,
  status = STATUS_CODE.OK,
  message = "Success!"
) => {
  return res.status(status).json({
    data,
    status,
    message,
  });
};

module.exports = {
  // orMiddleware,
  generateToken,
  generateVerifyCode,
  generateRandomPassword,
  formatFilePath,
  readAndTransformImageToBase64,
  formatResponse,
  STATUS_CODE,
  SOCKET_EVENT,
  SERVER_MESSAGE_TYPE,
};
