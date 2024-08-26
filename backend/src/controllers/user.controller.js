require("dotenv").config();

const db = require("../configs/db");
const Users = db.users;
const GlobalID = db.globalId;

const {formatFilePath, readAndTransformImageToBase64} = require("../utils/services");

const updateUser = async (req, res) => {
    const user = await Users.findByPk(req.user.id);
    if (!user)
        return res.status(404).json({
            data: {},
            status: 404,
            message: "User not found!"
        });

    user.full_name = req.body.full_name;
    user.about_me = req.body.about_me;
    user.day_of_birth = req.body.day_of_birth;
    user.avatar = req.file ? formatFilePath(req.file.filename) : user.avatar;

    console.log(user.avatar);

    await user.save();
    const {password, refresh_token, verify_code,...others} = user.dataValues;

    others.avatar = req.file ? await readAndTransformImageToBase64(user.avatar) : null;

    return res.status(200).json({
        data: others,
        status: 200,
        message: "Update profile successfully!"
    });
};

const getUser = async (req, res) => {
    const user = await Users.findByPk(req.user.id);
    if (!user)
        return res.status(404).json({
            data: {},
            status: 404,
            message: "User not found!"
        });

    const {password, refresh_token, verify_code,...others} = user.dataValues;

    others.avatar = await readAndTransformImageToBase64(user.avatar);

    return res.status(200).json({
        data: others,
        status: 200,
        message: "Get profile successfully!"
    });
};

const useGlobalID = async (req, res) => {  
    const globalId = await findOne({where: {id: req.body.global_id, user_id: req.user.id}});
    if (globalId)
        return res.status(400).json({
            data: {},
            status: 400,
            message: "You have already used this global ID!"
        });

    await GlobalID.create({
        id: req.body.global_id,
        user_id: req.user.id
    })

    return res.status(200).json({
        data: {},
        status: 200,
        message: "Successfully!"
    });
};

const createGlobalID = async (req, res) => {
    const id = Math.floor(Math.random() * (100000 - 1 + 1)) + 1;


    return res.status(200).json({
        data: {
            global_id: id
        },
        status: 200,
        message: "Successfully!"
    });
};

module.exports = {
    updateUser,
    getUser,
    useGlobalID,
    createGlobalID,
}