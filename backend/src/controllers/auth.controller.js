const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../configs/nodemailer");
require("dotenv").config();

const db = require("../configs/db");
const User = db.user;

const {
  readAndTransformImageToBase64,
  generateVerifyCode,
  generateRandomPassword,
  generateToken,
  formatResponse,
  STATUS_CODE,
} = require("../utils/services");

const registerUser = async (req, res) => {
  try {
    if (!req.body.email || !req.body.full_name || !req.body.password)
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "All fields are required!"
      );
    const user = await User.findOne({ where: { email: req.body.email } });
    if (user)
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "User already exists!"
      );

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);

    const verifyCode = generateVerifyCode();

    const newUser = {
      email: req.body.email,
      full_name: req.body.full_name,
      password: hashedPassword,
      verify_code: verifyCode,
    };

    await User.create(newUser)
      .then((user) => {
        sendEmail(user.email, verifyCode);
        return formatResponse(
          res,
          {},
          STATUS_CODE.SUCCESS,
          "Let's verify your email!"
        );
      })
      .catch((err) => {
        return formatResponse(
          res,
          {},
          STATUS_CODE.INTERNAL_SERVER_ERROR,
          err.message
        );
      });
  } catch (err) {
    console.log(err.message);
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      err.message
    );
  }
};

const verifyEmail = async (req, res) => {
  try {
    if (!req.body.verify_code || !req.body.email)
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "All fields are required!"
      );

    const verifyCode = req.body.verify_code;

    const user = await User.findOne({ where: { email: req.body.email } });

    if (!user) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "Email not found!"
      );
    }

    if (user.is_verify)
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "This email is verified!"
      );

    if (user.verify_code !== verifyCode)
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "Wrong verify code!"
      );

    user.is_verify = true;
    user.verify_code = null;
    await user.save();

    return formatResponse(
      res,
      {},
      STATUS_CODE.CREATED,
      "Verify email successfully!"
    );
  } catch (err) {
    console.log(err.message);
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      err.message
    );
  }
};

const getVerifyCode = async (req, res) => {
  try {
    if (!req.body.email)
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "All fields are required!"
      );

    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user)
      return formatResponse(res, {}, STATUS_CODE.NOT_FOUND, "Email not found!");

    const verifyCode = generateVerifyCode();

    user.verify_code = verifyCode;
    await user.save();

    sendEmail(user.email, verifyCode);

    return formatResponse(res, {}, STATUS_CODE.SUCCESS, "Let's verify!");
  } catch (err) {
    console.log(err.message);
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      err.message
    );
  }
};

const supResetPassword = async (req, res) => {
  try {
    if (!req.body.verify_code || !req.body.email)
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "All fields are required!"
      );

    const verifyCode = req.body.verify_code;

    const user = await User.findOne({ where: { email: req.body.email } });

    if (!user) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "Email not found!"
      );
    }

    if (user.verify_code !== verifyCode)
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "Wrong verify code!"
      );

    return formatResponse(
      res,
      {},
      STATUS_CODE.CREATED,
      "Verify code successfully!"
    );
  } catch (err) {
    console.log(err.message);
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      err.message
    );
  }
};

const resetPassword = async (req, res) => {
  try {
    if (!req.body.password || !req.body.verify_code || !req.body.email)
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "All fields are required!"
      );

    const verifyCode = req.body.verify_code;

    const user = await User.findOne({ where: { email: req.body.email } });

    if (!user) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "Email not found!"
      );
    }

    if (user.verify_code !== verifyCode) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "Wrong verify code. Can not change password!"
      );
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);

    user.password = hashedPassword;
    user.verify_code = null;
    await user.save();

    return formatResponse(
      res,
      {},
      STATUS_CODE.SUCCESS,
      "Change password successfully!"
    );
  } catch (err) {
    console.log(err.message);
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      err.message
    );
  }
};

const loginUser = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password)
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "All fields are required"
      );
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user)
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "User does not exists!"
      );

    if (!user.is_verify)
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "You must verify your email!"
      );

    const match = await bcrypt.compare(req.body.password, user.password);

    if (!match)
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "Incorrect password!"
      );

    const accessToken = generateToken(
      user,
      process.env.JWT_ACCESS_KEY,
      process.env.ACCESS_TIME
    );
    const refreshToken = generateToken(
      user,
      process.env.JWT_REFRESH_KEY,
      process.env.REFRESH_TIME
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "/api/auth/refresh",
      sameSite: "strict",
    });

    res.cookie("tokenLogout", refreshToken, {
      httpOnly: true,
      path: "/api/auth/logout",
      sameSite: "strict",
    });

    const { password, refresh_token, verify_code, ...others } = user.dataValues;

    user.refresh_token = refreshToken;
    await user.save();

    if (user.avatar)
      others.avatar = await readAndTransformImageToBase64(user.avatar);

    return formatResponse(
      res,
      {
        user: others,
        access_token: accessToken,
      },
      STATUS_CODE.SUCCESS,
      "Logged in successfully!"
    );
  } catch (err) {
    console.log(err.message);
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      err.message
    );
  }
};

const logoutUser = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { refresh_token: req.cookies.tokenLogout },
    });
    if (user) {
      user.refresh_token = null;
      await user.save();
    }

    res.clearCookie("refreshToken");
    res.clearCookie("tokenLogout");

    return formatResponse(
      res,
      {},
      STATUS_CODE.SUCCESS,
      "Logged out successfully!"
    );
  } catch (err) {
    console.log(err.message);
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      err.message
    );
  }
};

const requestRefreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return formatResponse(res, {}, STATUS_CODE.UNAUTHORIZED, "Unauthorized!");

    jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, async (err, user) => {
      if (err) {
        res.clearCookie("refreshToken");
        res.clearCookie("tokenLogout");
        return formatResponse(
          res,
          {},
          STATUS_CODE.UNAUTHORIZED,
          "Unauthorized!"
        );
      }

      const userDB = await User.findByPk(user.user_id);

      if (!userDB || refreshToken !== userDB.dataValues.refresh_token) {
        res.clearCookie("refreshToken");
        res.clearCookie("tokenLogout");
        return formatResponse(
          res,
          {},
          STATUS_CODE.UNAUTHORIZED,
          "Unauthorized!"
        );
      }

      const newAccessToken = generateToken(
        user,
        process.env.JWT_ACCESS_KEY,
        process.env.ACCESS_TIME
      );
      const newRefreshToken = generateToken(
        user,
        process.env.JWT_REFRESH_KEY,
        process.env.REFRESH_TIME
      );

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        path: "/api/auth/refresh",
        sameSite: "strict",
      });

      res.cookie("tokenLogout", newRefreshToken, {
        httpOnly: true,
        path: "/api/auth/logout",
        sameSite: "strict",
      });

      userDB.refresh_token = newRefreshToken;
      await userDB.save();

      return formatResponse(
        res,
        {
          access_token: newAccessToken,
        },
        STATUS_CODE.SUCCESS,
        "Refresh token successfully!"
      );
    });
  } catch (err) {
    console.log(err.message);
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      err.message
    );
  }
};

const oauthGoogle = async (req, res) => {
  try {
    let user = await User.findOne({ where: { email: req.body.email } });
    if (!user) {
      const newUser = {
        email: req.body.email,
        full_name: req.body.full_name,
        password: generateRandomPassword(20),
        is_verify: true,
      };

      await User.create(newUser);

      user = await User.findOne({ where: { email: req.body.email } });
    }

    const accessToken = generateToken(
      user,
      process.env.JWT_ACCESS_KEY,
      process.env.ACCESS_TIME
    );
    const refreshToken = generateToken(
      user,
      process.env.JWT_REFRESH_KEY,
      process.env.REFRESH_TIME
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "/api/auth/refresh",
      sameSite: "strict",
    });

    res.cookie("tokenLogout", refreshToken, {
      httpOnly: true,
      path: "/api/auth/logout",
      sameSite: "strict",
    });

    const { password, refresh_token, verify_code, ...others } = user.dataValues;

    user.refresh_token = refreshToken;
    await user.save();

    if (user.avatar)
      others.avatar = await readAndTransformImageToBase64(user.avatar);

    return formatResponse(
      res,
      {
        user: others,
        access_token: accessToken,
      },
      STATUS_CODE.SUCCESS,
      "Logged in successfully!"
    );
  } catch (err) {
    console.log(err.message);
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      err.message
    );
  }
};

module.exports = {
  loginUser,
  requestRefreshToken,
  logoutUser,
  oauthGoogle,
  registerUser,
  verifyEmail,
  getVerifyCode,
  resetPassword,
  supResetPassword,
};
